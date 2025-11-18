import { AdmittanceInstructions, TopicManager } from "@bsv/overlay";
import docs from "./ForumTopicDocs.md.js";
import { PublicKey, PushDrop, Transaction, Utils, P2PKH } from "@bsv/sdk";
import constants from "../const.js";

/**
 * Forum for a Topic Manager that can be modified for your specific use-case.
 */
export default class ForumTopicManager implements TopicManager {
  /**
   * Identify which outputs in the supplied transaction are admissible.
   *
   * @param beef          Raw transaction encoded in BEEF format.
   * @param previousCoins Previously‑retained coins.
   */
  async identifyAdmissibleOutputs(
    beef: number[],
    previousCoins: number[]
  ): Promise<AdmittanceInstructions> {
    const admissibleOutputs: number[] = [];

    try {
      const decodedTx = Transaction.fromBEEF(beef);
      const outputs = decodedTx.outputs;

      for (const [index, output] of outputs.entries()) {
        console.log("INDEX!!!!!!!:", index)
        try {
          const decodedScript = PushDrop.decode(output.lockingScript);
          const fields = decodedScript.fields;

          // Check if the output is a topic
          if (Utils.toUTF8(Utils.toArray(fields[0])) === "topic") {
            (await this.checkTopic(fields))
              ? admissibleOutputs.push(index)
              : console.log("Invalid topic");
            continue;
          }

          // Check if the output is a post
          if (Utils.toUTF8(Utils.toArray(fields[0])) === "post") {
            (await this.checkPost(fields))
              ? admissibleOutputs.push(index)
              : console.log("Invalid post");
            continue;
          }

          // Check if the output is a reply
          if (Utils.toUTF8(Utils.toArray(fields[0])) === "reply") {
            (await this.checkReply(fields))
              ? admissibleOutputs.push(index)
              : console.log("Invalid reply");
            continue;
          }

          // Check if the output is a reaction
          if (Utils.toUTF8(Utils.toArray(fields[0])) === "reaction") {
            (await this.checkReaction(fields, outputs, index))
              ? (admissibleOutputs.push(index), console.log("ADMITTED INDEX: " + index))
              : console.log("Invalid reaction");
            continue;
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.error("Error identifying admissible outputs", error);
    }

    return {
      outputsToAdmit: admissibleOutputs,
      coinsToRetain: [],
    };
  }

  /**
   * Get the documentation associated with this topic manager
   * @returns A promise that resolves to a string containing the documentation
   */
  async getDocumentation(): Promise<string> {
    return docs;
  }

  /**
   * Get metadata about the topic manager
   * @returns A promise that resolves to an object containing metadata
   */
  async getMetaData(): Promise<{
    name: string;
    shortDescription: string;
    iconURL?: string;
    version?: string;
    informationURL?: string;
  }> {
    return {
      name: "Forum Topic Manager",
      shortDescription: "Admit outputs into a topic",
    };
  }

  async checkTopic(fields: number[][]) {
    try {
      if (fields.length !== 6) {
        console.log("Invalid topic fields length");
        return false;
      }

      const titleStr = Utils.toUTF8(Utils.toArray(fields[1]));
      const allowed = /^[A-Za-z0-9_-]+$/;
      if (!allowed.test(titleStr)) {
        console.log("Invalid topic name");
        return false;
      }

      if (fields[2].length === 0) {
        console.log("Invalid topic description");
        return false;
      }

      const createdAt = parseInt(Utils.toUTF8(Utils.toArray(fields[3])), 10);
      const now = Date.now();
      const thirtyMin = 30 * 60 * 1000;

      if (
        Number.isNaN(createdAt) ||
        createdAt > now ||
        createdAt < now - thirtyMin
      ) {
        console.log("Invalid topic created_at");
        return false;
      }

      try {
        PublicKey.fromString(Utils.toUTF8(Utils.toArray(fields[4])));
      } catch {
        console.log("Invalid public key format.");
        return false;
      }
    } catch (error) {
      console.error("Error checking topic", error);
      return false;
    }

    return true;
  }

  async checkPost(fields: number[][]) {
    try {
      console.log("fields", fields);

      if (fields.length !== 9) {
        console.log("Invalid post fields length");
        return false;
      }

      if (fields[1].length === 0) {
        console.log("Invalid post topic txid");
        return false;
      }

      if (fields[2].length === 0) {
        console.log("Invalid post title");
        return false;
      }

      if (fields[3].length === 0) {
        console.log("Invalid post body");
        return false;
      }

      const createdAt = parseInt(Utils.toUTF8(Utils.toArray(fields[4])), 10);
      const now = Date.now();
      const thirtyMin = 30 * 60 * 1000;

      if (
        Number.isNaN(createdAt) ||
        createdAt > now ||
        createdAt < now - thirtyMin
      ) {
        console.log("Invalid post created_at");
        return false;
      }

      try {
        PublicKey.fromString(Utils.toUTF8(Utils.toArray(fields[5])));
      } catch {
        console.log("Invalid public key format.");
        return false;
      }

      // No check for tags
      // No check for pre-edit txid
    } catch (error) {
      console.error("Error checking post", error);
      return false;
    }

    return true;
  }

  async checkReply(fields: number[][]) {
    try {
      console.log(fields.length)
      for (const field of fields) {
        console.log(Utils.toUTF8(Utils.toArray(field)))
      }
      if (fields.length !== 8) {
        console.log("Invalid reply fields length");
        return false;
      }

      if (fields[1].length === 0) {
        console.log("Invalid reply post txid");
        return false;
      }

      // No check for parent reply id

      if (fields[3].length === 0) {
        console.log("Invalid reply body");
        return false;
      }

      const createdAt = parseInt(Utils.toUTF8(Utils.toArray(fields[4])), 10);
      const now = Date.now();
      const thirtyMin = 30 * 60 * 1000;

      if (
        Number.isNaN(createdAt) ||
        createdAt > now ||
        createdAt < now - thirtyMin
      ) {
        console.log("Invalid reply created_at");
        return false;
      }

      try {
        PublicKey.fromString(Utils.toUTF8(Utils.toArray(fields[5])));
      } catch {
        console.log("Invalid public key format.");
        return false;
      }

      // No check for pre-edit txid
    } catch (error) {
      console.error("Error checking reply", error);
      return false;
    }

    return true;
  }

  async checkReaction(fields: number[][], outputs: any[], reactionIndex: number) {
    try {
      // Require recipient identity key included (7th field)
      if (fields.length !== 10) {
        console.log("Invalid reaction fields length");
        return false;
      }

      if (fields[1].length === 0) {
        console.log("Invalid reaction topic txid");
        return false;
      }

      if (fields[2].length === 0) {
        console.log("Invalid reaction parent post txid");
        return false;
      }

      if (fields[3].length === 0) {
        console.log("Invalid reaction direct parent txid");
        return false;
      }

      if (fields[4].length === 0) {
        console.log("Invalid reaction reaction");
        return false;
      }

      // Validate creator and recipient public keys
      let createdByStr = "";
      let recipientKeyStr = "";
      try {
        createdByStr = Utils.toUTF8(Utils.toArray(fields[5]));
        PublicKey.fromString(createdByStr);
      } catch {
        console.log("Invalid public key format for createdBy.");
        return false;
      }
      try {
        recipientKeyStr = Utils.toUTF8(Utils.toArray(fields[6]));
        PublicKey.fromString(recipientKeyStr);
      } catch {
        console.log("Invalid recipient public key format.");
        return false;
      }

      if (fields[7].length === 0) {
        console.log("Invalid reaction derivation prefix");
        return false;
      }

      if (fields[8].length === 0) {
        console.log("Invalid reaction derivation suffix");
        return false;
      }
      
      // Determine required payout from emoji price map (normalize variants)
      const rawEmoji = Utils.toUTF8(Utils.toArray(fields[4]));
      const baseEmoji = rawEmoji
        .replace(/\uFE0F/g, '')
        .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '');
      const emojiKey = (constants.emojiPrices as any)[rawEmoji] ? rawEmoji : baseEmoji;
      const requiredSats = constants.emojiPrices[emojiKey] ?? 0;
      if (!(requiredSats > 0)) {
        console.log("No price configured for emoji");
        return false;
      }

      const expectedRecipientScriptHex = new P2PKH()
        .lock(PublicKey.fromString(recipientKeyStr).toAddress())
        .toHex();

      const hasValidPayout = outputs.some((o) => {
        try {
          const ls: any = (o as any).lockingScript;
          const scriptHex = typeof ls === 'string' ? ls : (typeof ls?.toHex === 'function' ? ls.toHex() : '');
          const sats = (o as any).satoshis;
          return scriptHex === expectedRecipientScriptHex && typeof sats === 'number' && sats >= requiredSats;
        } catch {
          return false;
        }
      });

      if (!hasValidPayout) {
        console.log("No valid recipient payout found in transaction");
        return false;
      }
    } catch (error) {
      console.error("Error checking reaction", error);
      return false;
    }

    return true;
  }
}
