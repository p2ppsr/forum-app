import {LookupResolver, PushDrop, Transaction, Utils
} from "@bsv/sdk"
import type { LookupQuestion } from "@bsv/overlay"
import type{ Topic, Post, Reply, Reaction } from "./types.js"
import type { forumQuery } from "./types"
import constants from "../constants.js"
export async function fetchAllTopics(): Promise<Topic[]> {
let query = {
    query: 'getAllTopics'
} as forumQuery
  let question = {
    service: constants.lookupService,
    query: query} as LookupQuestion
    const resolver = new LookupResolver({networkPreset:
      window.location.hostname === "localhost" ? "local" : "mainnet",})
    const lookupResult = await resolver.query(question)

    if(lookupResult.type !== 'output-list'){
        throw new Error('Unexpected response from lookup service')
    }
    let topics: Topic[] = [] 
    for(const output of lookupResult.outputs){
        const parsedTransaction = await Transaction.fromBEEF(output.beef)
        const decodedOutput = await PushDrop.decode(parsedTransaction.outputs[0].lockingScript)
        const fields = decodedOutput.fields
        let type = Utils.toUTF8(Utils.toArray(fields[0]))
        if(type !== 'topic'){
            throw new Error('Unexpected output type: expected topic but got '+type)
        }
        topics.push({
            id: parsedTransaction.id('hex'),
            type: type,
            title: Utils.toUTF8(Utils.toArray(fields[1])),
            description: Utils.toUTF8(Utils.toArray(fields[2])),
            createdAt: Utils.toUTF8(fields[3]),
            createdBy: Utils.toUTF8(Utils.toArray(fields[4])),
        })
    }
    return topics
}
export async function fetchAllPosts(topicID: string): Promise<Post[]> {
    let query = {
        query: 'getAllPosts',
        parameter: topicID
    } as forumQuery
    let question = {
        service: constants.lookupService,
        query: query} as LookupQuestion
        const resolver = new LookupResolver({ networkPreset:
      window.location.hostname === "localhost" ? "local" : "mainnet", })
        const lookupResult = await resolver.query(question)
    
        if(lookupResult.type !== 'output-list'){
            throw new Error('Unexpected response from lookup service')
        }
    
        let posts: Post[] = [] 
        for(const output of lookupResult.outputs){
            const parsedTransaction = await Transaction.fromBEEF(output.beef)
            const decodedOutput = await PushDrop.decode(parsedTransaction.outputs[0].lockingScript)
            const fields = decodedOutput.fields
            let type = Utils.toUTF8(Utils.toArray(fields[0]))
            if(type !== 'post'){
                throw new Error('Unexpected output type: expected post but got '+type)
            }
            posts.push({
                id: parsedTransaction.id('hex'),
                type: type,
                topicId: Utils.toUTF8(Utils.toArray(fields[1])),
                title: Utils.toUTF8(Utils.toArray(fields[2])),
                body: Utils.toUTF8(Utils.toArray(fields[3])),
                createdAt: Utils.toUTF8(fields[4]),
                createdBy: Utils.toUTF8(Utils.toArray(fields[5])),
                tags: fields[6] ? Utils.toUTF8(Utils.toArray(fields[6])).split(',') : undefined,
            })
        }
        return posts
}
export async function fetchPost(post_txid: string): Promise<{post: Post | null, replies: Reply[], reactions: Reaction[]}> {
    let query = {
        query: 'getPost',
        parameter: post_txid
    } as forumQuery
    let question = {
        service: constants.lookupService,
        query: query} as LookupQuestion
        const resolver = new LookupResolver({ networkPreset:
      window.location.hostname === "localhost" ? "local" : "mainnet", })
        const lookupResult = await resolver.query(question)
        
        if(lookupResult.type !== 'output-list'){
            throw new Error('Unexpected response from lookup service')
        }
        let post: Post | null = null
        let replies: Reply[] = []
        let reactions: Reaction[] = []
    for(const output of lookupResult.outputs){
        const parsedTransaction = await Transaction.fromBEEF(output.beef)
        const decodedOutput = await PushDrop.decode(parsedTransaction.outputs[0].lockingScript)
        const fields = decodedOutput.fields
        let type = Utils.toUTF8(Utils.toArray(fields[0]))
        if(type === 'post'){
            post = {
                id: parsedTransaction.id('hex'),
                type: type,
                topicId: Utils.toUTF8(Utils.toArray(fields[1])),
                title: Utils.toUTF8(Utils.toArray(fields[2])),
                body: Utils.toUTF8(Utils.toArray(fields[3])),
                createdAt: Utils.toUTF8(fields[4]),
                createdBy: Utils.toUTF8(Utils.toArray(fields[5])),
                tags: fields[6] ? Utils.toUTF8(Utils.toArray(fields[6])).split(',') : undefined,
            }
        }
        else if(type === 'reply'){
            replies.push( {
                id: parsedTransaction.id('hex'),
                type: type,
                parentPostId: Utils.toUTF8(Utils.toArray(fields[2])),
                parentReplyId: Utils.toUTF8(Utils.toArray(fields[3])),
                body: Utils.toUTF8(Utils.toArray(fields[4])),
                createdAt: Utils.toUTF8(fields[5]),
                createdBy: Utils.toUTF8(Utils.toArray(fields[6])),
            })
        }
        else if(type === 'reaction'){
            reactions.push( {
                id: parsedTransaction.id('hex'),
                type: type,
                directParentTxid: Utils.toUTF8(Utils.toArray(fields[2])),
                body: Utils.toUTF8(Utils.toArray(fields[3])),
                createdBy: Utils.toUTF8(Utils.toArray(fields[4])),
                parentPostId: Utils.toUTF8(Utils.toArray(fields[1])),
            })
        }
        else{
            throw new Error('Unexpected output type: expected post, reply or reaction but got '+type)
        }
    }
    return {post, replies, reactions}
}