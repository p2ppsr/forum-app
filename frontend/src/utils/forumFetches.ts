import {LookupResolver, WalletClient, PushDrop, Transaction, Utils
 } from "@bsv/sdk"
import type { LookupQuestion } from "@bsv/overlay"
import type{ Topic, Post, Reply, Reaction } from "./types.js"
import type { forumQuery } from "./types"
import constants from "../constants.js"
export async function fetchAllTopics(): Promise<Topic[]> {
let query = {
    query: 'getAllTopics',
    parameters: {}
} as forumQuery
let question = {
    service: constants.lookupService,
    query: query} as LookupQuestion
    const walletclient = new WalletClient()
    const network = await walletclient.getNetwork()
    const resolver = new LookupResolver({ networkPreset: location.hostname === 'localhost' ? "local": network })
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
            created_at: Utils.toUTF8(fields[3]),
            created_by: Utils.toUTF8(Utils.toArray(fields[4])),
        })
    }
    return topics
}
export async function fetchAllPosts(topicID: string): Promise<Post[]> {
    let query = {
        query: 'getAllPosts',
        parameters: topicID
    } as forumQuery
    let question = {
        service: constants.lookupService,
        query: query} as LookupQuestion
        const walletclient = new WalletClient()
        const network = await walletclient.getNetwork()
        const resolver = new LookupResolver({ networkPreset: location.hostname === 'localhost' ? "local": network })
        const lookupResult = await resolver.query(question)
    
        if(lookupResult.type !== 'output-list'){
            throw new Error('Unexpected response from lookup service')
        }
    
        let posts = [] 
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
                topicID: Utils.toUTF8(Utils.toArray(fields[1])),
                title: Utils.toUTF8(Utils.toArray(fields[2])),
                body: Utils.toUTF8(Utils.toArray(fields[3])),
                created_at: Utils.toUTF8(fields[4]),
                created_by: Utils.toUTF8(Utils.toArray(fields[5])),
                tags: fields[6] ? Utils.toUTF8(Utils.toArray(fields[6])).split(',') : undefined,
            })
        }
        return posts
}
export async function fetchPost(post_txid: string): Promise<{post: Post | null, replies: Reply[], reactions: Reaction[]}> {
    let query = {
        query: 'getPost',
        parameters: post_txid
    } as forumQuery
    let question = {
        service: 'ls_forumls_test_forum_1',
        query: query} as LookupQuestion
        const walletclient = new WalletClient()
        const network = await walletclient.getNetwork()
        const resolver = new LookupResolver({ networkPreset: location.hostname === 'localhost' ? "local": network })
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
                topicID: Utils.toUTF8(Utils.toArray(fields[1])),
                title: Utils.toUTF8(Utils.toArray(fields[2])),
                body: Utils.toUTF8(Utils.toArray(fields[3])),
                created_at: Utils.toUTF8(fields[4]),
                created_by: Utils.toUTF8(Utils.toArray(fields[5])),
                tags: fields[6] ? Utils.toUTF8(Utils.toArray(fields[6])).split(',') : undefined,
            }
        }
        else if(type === 'reply'){
            replies.push( {
                id: parsedTransaction.id('hex'),
                type: type,
                parent_postID: Utils.toUTF8(Utils.toArray(fields[2])),
                parent_replyID: Utils.toUTF8(Utils.toArray(fields[3])),
                body: Utils.toUTF8(Utils.toArray(fields[4])),
                created_at: Utils.toUTF8(fields[5]),
                created_by: Utils.toUTF8(Utils.toArray(fields[6])),
            })
        }
        else if(type === 'reaction'){
            reactions.push( {
                id: parsedTransaction.id('hex'),
                type: type,
                p_r_txid: Utils.toUTF8(Utils.toArray(fields[3])),
                body: Utils.toUTF8(Utils.toArray(fields[4])),
                created_by: Utils.toUTF8(Utils.toArray(fields[5])),
                parent_postID: Utils.toUTF8(Utils.toArray(fields[6])),
            })
        }
        else{
            throw new Error('Unexpected output type: expected post, reply or reaction but got '+type)
        }
    }
    return {post, replies, reactions}
}