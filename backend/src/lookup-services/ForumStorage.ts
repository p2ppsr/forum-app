import { Collection, Db } from 'mongodb'
import { ForumRecord, UTXOReference } from '../types'
import { Metadata } from '../types'
// Forum for a Storage System that can be modified for your specific use-case.
export class ForumStorage {
  private readonly posts: Collection<ForumRecord>
  private readonly topics: Collection<ForumRecord>
  private readonly reactions: Collection<ForumRecord>
  private readonly replys: Collection<ForumRecord>
  /**
   * Constructs a new instance of the database
   * @param {Db} db - A connected MongoDB database instance.
   */
  constructor(private readonly db: Db) {
    this.posts = db.collection<ForumRecord>('forumPosts')
    this.topics = db.collection<ForumRecord>('forumtopics')
    this.reactions = db.collection<ForumRecord>('forumReactions')
    this.replys = db.collection<ForumRecord>('forumReplys')

  }

  /**
   * Stores a new record in the database.
   * @param {string} txid - The transaction ID associated with this record
   * @param {number} outputIndex - The UTXO output index
   * @returns {Promise<void>} - Resolves when the record has been successfully stored
   */
  async storeRecord(txid: string, outputIndex: number, where: string, metadata: Metadata): Promise<void> {
    switch (where) {
      case 'post':
        await this.posts.insertOne({
          txid,
          outputIndex,
          createdAt: new Date(),
          topicID: metadata.field1
        })
      break
      case 'topic':
        await this.topics.insertOne({
          txid,
          outputIndex,
          createdAt: new Date(),
          topicTitle: metadata.field1
        })
      break
      case 'reaction':

        console.log('reaction:')
        console.log(txid)
        console.log(outputIndex)
        console.log(metadata.field1)
        console.log(metadata.field2)
        console.log(metadata.field3)
        console.log(metadata.field4)
        console.log(metadata.field5)
        
        console.log(metadata.payoutSats)

        await this.reactions.insertOne({
          txid,
          outputIndex,
          createdAt: new Date(),
          parent_postID: metadata.field2,
          topicID: metadata.field1,
          emoji: metadata.field3,
          createdBy: metadata.field4,
          recipient: metadata.field5,
          payoutSats: metadata.payoutSats
        })
      break
      case 'reply':
        await this.replys.insertOne({
          txid,
          outputIndex,
          createdAt: new Date(),
          parent_postID: metadata.field1
        })
        break
      default:
        throw new Error('Invalid collection name')  
    }
  }

  /**
   * Deletes a record that matches the given transaction ID and output index.
   * @param {string} txid - The transaction ID of the record to delete
   * @param {number} outputIndex - The UTXO output index of the record to delete
   * @returns {Promise<void>} - Resolves when the record has been successfully deleted
   */
  async deleteRecord(txid: string, outputIndex: number): Promise<void> {
    try {
        const collections = await this.db.listCollections().toArray() || []
        for (const collection of collections) {
            await this.db.collection(collection.name).deleteMany({ txid, outputIndex })
            console.log(`Deleted documents from collection: ${collection.name}`)
        }
    } catch (error) {
        console.error("Error deleting from collections:", error)
    }
  }

  /**
   * Example query: retrieves all records stored on the database  
   * @returns {Promise<UTXOReference[]>} - Resolves with an array of UTXO references
   */
  async findAllPost(topicID: string): Promise<UTXOReference[]> {
    let utxos = [] as UTXOReference[]
    const posts = await this.posts.find({topicID: topicID}).toArray()
    for(const post of posts)
    {
      utxos.push({txid: post.txid, outputIndex: post.outputIndex})
    }
    const reactions = await this.reactions.find({topicID: topicID}).toArray()
    for(const reaction of reactions)
    {
      utxos.push({txid: reaction.txid, outputIndex: reaction.outputIndex})
    }
    return utxos
  }
  async findAlltopics(): Promise<UTXOReference[]> {
    const query: any = {}
    return await this.topics.find(query)
      .project<UTXOReference>({ txid: 1, outputIndex: 1 })
      .toArray()
      .then(results => results.map(record => ({
        txid: record.txid,
        outputIndex: record.outputIndex
      })))
  }
  async findAllReactions(): Promise<UTXOReference[]> {
    const query: any = {}
    return await this.reactions.find(query)
      .project<UTXOReference>({ txid: 1, outputIndex: 1 })
      .toArray()
      .then(results => results.map(record => ({
        txid: record.txid,
        outputIndex: record.outputIndex
      })))
  }
  async findAllReplys(): Promise<UTXOReference[]> {
    const query: any = {}
    return await this.replys.find(query)
      .project<UTXOReference>({ txid: 1, outputIndex: 1 })
      .toArray()
      .then(results => results.map(record => ({
        txid: record.txid,
        outputIndex: record.outputIndex
      })))
  } 
  async findPost(parent_postID: string): Promise<UTXOReference[]> {
    let utxos = [] as UTXOReference[]
    const post = await this.posts.findOne({txid: parent_postID})
    if(post)
    {
      utxos.push({txid: post.txid, outputIndex: post.outputIndex})
    }
    const replys = await this.replys.find({parent_postID: parent_postID}).toArray()
    for(const reply of replys)
    {
      utxos.push({txid: reply.txid, outputIndex: reply.outputIndex})
    }
    const reactions = await this.reactions.find({parent_postID: parent_postID}).toArray()
    for(const reaction of reactions)
    {
      utxos.push({txid: reaction.txid, outputIndex: reaction.outputIndex})
    }
    return utxos
  } 
  async findTopic(topicTitle: string): Promise<UTXOReference[]> {
    let utxos = [] as UTXOReference[]
    const topic = await this.topics.findOne({topicTitle: topicTitle})
    if(topic)
    {
      utxos.push({txid: topic.txid, outputIndex: topic.outputIndex})
    }
    return utxos
  }
  async findReactionByTxid({txid, outputIndex}: {txid: string, outputIndex: number}): Promise<UTXOReference[]> {
    let utxos = [] as UTXOReference[]
    const reaction = await this.reactions.findOne({txid: txid, outputIndex: outputIndex})
    if(reaction)
    {
      utxos.push({txid: reaction.txid, outputIndex: reaction.outputIndex})
    }
    return utxos
  }
}