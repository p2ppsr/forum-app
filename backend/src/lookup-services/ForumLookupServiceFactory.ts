import docs from './ForumLookupDocs.md.js'
import {
  LookupService,
  LookupQuestion,
  LookupAnswer,
  LookupFormula,
  AdmissionMode,
  SpendNotificationMode,
  OutputAdmittedByTopic,
  OutputSpent
} from '@bsv/overlay'
import { ForumStorage } from './ForumStorage.js'
import { Db } from 'mongodb'
import constants from '../const.js'
import { PushDrop, Utils } from '@bsv/sdk'
import { forumQuery } from '../types.js'
/**
 * Forum for a Lookup Service that can be modified for your speicific use-case.
 */
export class ForumLookupService implements LookupService {
  readonly admissionMode: AdmissionMode = 'locking-script'
  readonly spendNotificationMode: SpendNotificationMode = 'none'

  constructor(public storage: ForumStorage) { }

  /**
   * Invoked when a new output is added to the overlay.
   * @param payload 
   */
  async outputAdmittedByTopic(payload: OutputAdmittedByTopic): Promise<void> {
    if (payload.mode !== 'locking-script') throw new Error('Invalid mode')
    
    const { topic, lockingScript, txid, outputIndex } = payload
    
    if(topic != constants.topicManager) return
    try
    {
      const decodedOutput = await PushDrop.decode(lockingScript)
      const fields = decodedOutput.fields
      console.log("output: ", decodedOutput)
      console.log("fields: ", fields)
     if(Utils.toUTF8(Utils.toArray(fields[0])) == 'post' )
      {
        await this.storage.storeRecord(txid, outputIndex, 'post', {field1: Utils.toUTF8(Utils.toArray(fields[1]))} )
      }
      else if(Utils.toUTF8(Utils.toArray(fields[0])) == 'topic' )
      {
        await this.storage.storeRecord(txid, outputIndex, 'topic', {field1: Utils.toUTF8(Utils.toArray(fields[1]))} )
      }
      else if(Utils.toUTF8(Utils.toArray(fields[0])) == 'reaction' )
      {
        const topicId = Utils.toUTF8(Utils.toArray(fields[1]))
        const parentPostId = Utils.toUTF8(Utils.toArray(fields[2]))
        const emoji = Utils.toUTF8(Utils.toArray(fields[4]))
        const createdBy = Utils.toUTF8(Utils.toArray(fields[5]))
        // recipient public key is required by TopicManager, but guard anyway
        const recipient = fields[6] ? Utils.toUTF8(Utils.toArray(fields[6])) : undefined
        const expectedPayout = constants.emojiPrices[emoji] ?? 0
        await this.storage.storeRecord(txid, outputIndex, 'reaction', {
          field1: topicId,
          field2: parentPostId,
          field3: emoji,
          field4: createdBy,
          field5: recipient,
          payoutSats: expectedPayout
        })
      }
      else if(Utils.toUTF8(Utils.toArray(fields[0])) == 'reply' )
      {
        await this.storage.storeRecord(txid, outputIndex, 'reply', {field1: Utils.toUTF8(Utils.toArray(fields[1]))})
      }
    }
    catch(e){
    
      throw new Error('Error processing output')}
    return
  }

  /**
   * Invoked when a UTXO is spent
   * @param payload - The output admitted by the topic manager
   */
  async outputSpent(payload: OutputSpent): Promise<void> {
    const { topic, txid, outputIndex } = payload
    if(topic != constants.topicManager) return
    await this.storage.deleteRecord(txid, outputIndex)
    return
  }

  /**
   * LEGAL EVICTION: Permanently remove the referenced UTXO from all indices maintained by the Lookup Service
   * @param txid - The transaction ID of the output to evict
   * @param outputIndex - The index of the output to evict
   */
  async outputEvicted(txid: string, outputIndex: number): Promise<void> {
    await this.storage.deleteRecord(txid, outputIndex)
    return
  }

  /**
   * Answers a lookup query
   * @param question - The lookup question to be answered
   * @returns A promise that resolves to a lookup answer or formula
   */
  async lookup(question: LookupQuestion): Promise<LookupAnswer | LookupFormula> {
      const {query, parameter } = question.query as forumQuery
      // Validate query presence
      if (!query) {
        throw new Error('A valid query must be provided!');
      }
      // Validate service
      if (question.service !== constants.lookupService) {
        throw new Error('Lookup service not supported!');
      }

      // Handle specific queries
      if(query === 'getTopic' && parameter )
      {
          return await this.storage.findTopic(parameter)
      }
      if (query === 'getAllTopics') {
        return await this.storage.findAlltopics()
      }  
      if(query === 'getPost' && parameter )
      {
         return await this.storage.findPost(parameter)
      }
      if(query === 'getAllPosts' && parameter)
      {
          return await this.storage.findAllPost(parameter)
      }
      if(query === 'getAllReactions')
      {
          return await this.storage.findAllReactions()
      }
      if(query === 'getReactionByTxid' && parameter)
      {
        return await this.storage.findReactionByTxid(parameter)
      }
      if(query === 'getpaymentsfor' && parameter)
      {
        return await this.storage.findPaymentsForUser(parameter.publicKey)
      }
      throw new Error('Unknown query type: ' + query + ' with parameter: ' + parameter);
    }

  /** Overlay docs. */
  async getDocumentation(): Promise<string> {
    return docs
  }

  /** Metadata for overlay hosts. */
  async getMetaData(): Promise<{
    name: string
    shortDescription: string
    iconURL?: string
    version?: string
    informationURL?: string
  }> {
    return {
      name: 'Forum Lookup Service',
      shortDescription: 'Find messages on-chain'
    }
  }
}

// Factory
export default (db: Db): ForumLookupService => new ForumLookupService(new ForumStorage(db))
