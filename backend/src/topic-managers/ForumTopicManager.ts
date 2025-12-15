import { AdmittanceInstructions, TopicManager } from '@bsv/overlay'
import docs from './ForumTopicDocs.md.js'
import {
  PublicKey,
  PushDrop,
  Transaction,
  Utils,
  P2PKH,
  ProtoWallet,
  StorageUtils,
} from '@bsv/sdk'
import constants from '../const.js'

export default class ForumTopicManager implements TopicManager {
  async identifyAdmissibleOutputs(
    beef: number[],
    previousCoins: number[]
  ): Promise<AdmittanceInstructions> {
    const admissibleOutputs: number[] = []

    try {
      const decodedTx = Transaction.fromBEEF(beef)
      const outputs = decodedTx.outputs

      for (const [index, output] of outputs.entries()) {
        try {
          const decodedScript = PushDrop.decode(output.lockingScript)
          const fields = decodedScript.fields
          const kind = this.toStr(fields, 0)

          if (kind === 'topic') {
            if (await this.checkTopic(fields)) admissibleOutputs.push(index)
            continue
          }
          if (kind === 'post') {
            if (await this.checkPost(fields)) admissibleOutputs.push(index)
            continue
          }
          if (kind === 'reply') {
            if (await this.checkReply(fields)) admissibleOutputs.push(index)
            continue
          }
          if (kind === 'reaction') {
            if (await this.checkReaction(fields, outputs)) admissibleOutputs.push(index)
            continue
          }
        } catch {
          // Not a PushDrop output or malformed; ignore
          continue
        }
      }
    } catch (error) {
      console.error('[BLOCKTEST] Error identifying admissible outputs', error)
    }

    return {
      outputsToAdmit: admissibleOutputs,
      coinsToRetain: previousCoins,
    }
  }

  async getDocumentation(): Promise<string> {
    return docs
  }

  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'Forum Topic Manager',
      shortDescription: 'Admit outputs into a topic',
    }
  }

  // ---------------------------
  // Helpers (safe + consistent)
  // ---------------------------

  private toStr(fields: number[][], idx: number): string {
    const f = fields[idx]
    return f ? Utils.toUTF8(Utils.toArray(f)) : ''
  }

  private hasNonEmpty(fields: number[][], idx: number): boolean {
    const f = fields[idx]
    return Array.isArray(f) && f.length > 0
  }

  private isReasonableCreatedAt(createdAtStr: string): boolean {
    const createdAt = Number.parseInt(createdAtStr, 10)
    if (!Number.isFinite(createdAt)) return false
    if (createdAt < 0) return false

    const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000
    if (createdAt > Date.now() + MAX_FUTURE_SKEW_MS) return false

    return true
  }

  // ---------------------------
  // Validators
  // ---------------------------

  async checkTopic(fields: number[][]): Promise<boolean> {
    try {
      if (fields.length !== 6) return false

      const titleStr = this.toStr(fields, 1)
      const allowed = /^[A-Za-z0-9_-]+$/
      if (!allowed.test(titleStr)) return false

      if (!this.hasNonEmpty(fields, 2)) return false

      const createdAtStr = this.toStr(fields, 3)
      if (!this.isReasonableCreatedAt(createdAtStr)) return false

      // creator pubkey
      const pubKeyStr = this.toStr(fields, 4)
      try {
        PublicKey.fromString(pubKeyStr)
      } catch {
        return false
      }

      return true
    } catch (e) {
      console.error('[BLOCKTEST] Error checking topic', e)
      return false
    }
  }

  async checkPost(fields: number[][]): Promise<boolean> {
    try {
      if (fields.length !== 10) return false

      if (!this.hasNonEmpty(fields, 1)) return false // topic txid
      if (!this.hasNonEmpty(fields, 2)) return false // title

      // image URL OR body required
      const imageField = fields[3]
      const hasImage = Array.isArray(imageField) && imageField.length >= 8
      if (hasImage) {
        const imageUrl = this.toStr(fields, 3)
        if (!StorageUtils.isValidURL(imageUrl)) return false
      } else {
        if (!this.hasNonEmpty(fields, 4)) return false // body
      }

      const createdAtStr = this.toStr(fields, 5)
      if (!this.isReasonableCreatedAt(createdAtStr)) return false

      const pubKeyStr = this.toStr(fields, 6)
      try {
        PublicKey.fromString(pubKeyStr)
      } catch {
        return false
      }

      return true
    } catch (e) {
      console.error('[BLOCKTEST] Error checking post', e)
      return false
    }
  }

  async checkReply(fields: number[][]): Promise<boolean> {
    try {
      if (fields.length !== 9) return false

      if (!this.hasNonEmpty(fields, 1)) return false // post txid

      // body required
      if (!this.hasNonEmpty(fields, 4)) return false

      const createdAtStr = this.toStr(fields, 5)
      if (!this.isReasonableCreatedAt(createdAtStr)) return false

      const pubKeyStr = this.toStr(fields, 6)
      try {
        PublicKey.fromString(pubKeyStr)
      } catch {
        return false
      }

      return true
    } catch (e) {
      console.error('[BLOCKTEST] Error checking reply', e)
      return false
    }
  }

  async checkReaction(fields: number[][], outputs: any[]): Promise<boolean> {
    try {
      if (fields.length !== 10) return false

      if (!this.hasNonEmpty(fields, 1)) return false // topic txid
      if (!this.hasNonEmpty(fields, 2)) return false // parent post txid
      if (!this.hasNonEmpty(fields, 3)) return false // direct parent txid
      if (!this.hasNonEmpty(fields, 4)) return false // emoji

      // Validate creator + recipient pubkeys
      const createdByStr = this.toStr(fields, 5)
      const recipientKeyStr = this.toStr(fields, 6)

      try {
        PublicKey.fromString(createdByStr)
      } catch {
        return false
      }
      try {
        PublicKey.fromString(recipientKeyStr)
      } catch {
        return false
      }

      if (!this.hasNonEmpty(fields, 7)) return false // derivation prefix
      if (!this.hasNonEmpty(fields, 8)) return false // derivation suffix

      // Determine required payout from emoji price map (normalize variants)
      const rawEmoji = this.toStr(fields, 4)
      const baseEmoji = rawEmoji
        .replace(/\uFE0F/g, '')
        .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
      const emojiKey = (constants.emojiPrices as any)[rawEmoji] ? rawEmoji : baseEmoji
      const requiredSats = constants.emojiPrices[emojiKey] ?? 0
      if (!(requiredSats > 0)) return false

      // Derive expected recipient locking script
      const prefix = this.toStr(fields, 7)
      const suffix = this.toStr(fields, 8)

      const anyoneWallet = new ProtoWallet('anyone')
      const { publicKey: derivedPublicKey } = await anyoneWallet.getPublicKey({
        protocolID: [2, '3241645161d8'],
        keyID: `${prefix} ${suffix}`,
        counterparty: recipientKeyStr,
      })

      const expectedRecipientScriptHex = new P2PKH()
        .lock(PublicKey.fromString(derivedPublicKey).toAddress())
        .toHex()
        .toLowerCase()

      // IMPORTANT: scan ALL outputs for the payout (not hard-coded outputs[1])
      const hasValidPayout = outputs.some((o: any) => {
        try {
          const scriptHex = o?.lockingScript?.toHex?.()?.toLowerCase?.()
          const sats = o?.satoshis
          return (
            typeof scriptHex === 'string' &&
            scriptHex === expectedRecipientScriptHex &&
            typeof sats === 'number' &&
            sats >= requiredSats
          )
        } catch {
          return false
        }
      })

      if (!hasValidPayout) return false

      return true
    } catch (e) {
      console.error('[BLOCKTEST] Error checking reaction', e)
      return false
    }
  }
}