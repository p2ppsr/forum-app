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
export async function fetchAllPosts(
  topicID: string
): Promise<Array<{ post: Post; reactions: Reaction[] }>> {
  const query = { query: "getAllPosts", parameter: topicID } as forumQuery;
  const question = { service: constants.lookupService, query } as LookupQuestion;

  const resolver = new LookupResolver({
    networkPreset: window.location.hostname === "localhost" ? "local" : "mainnet",
  });
  const lookupResult = await resolver.query(question);

  if (lookupResult.type !== "output-list") {
    throw new Error("Unexpected response from lookup service");
  }

  const posts: Post[] = [];
  const reactions: Reaction[] = [];

  for (const output of lookupResult.outputs) {
    const tx = await Transaction.fromBEEF(output.beef);
    // Scan all outputs; some transactions (reactions) have fee/payout outputs before the PushDrop output
    for (const o of tx.outputs) {
      try {
        const decoded = await PushDrop.decode(o.lockingScript as any);
        const fields = decoded.fields;
        const type = Utils.toUTF8(Utils.toArray(fields[0]));

        if (type === "post") {
          const post: Post = {
            id: tx.id("hex"),
            type,
            topicId: Utils.toUTF8(Utils.toArray(fields[1])),
            title: Utils.toUTF8(Utils.toArray(fields[2])),
            uhrpUrl: Utils.toUTF8(Utils.toArray(fields[3])),
            body: Utils.toUTF8(Utils.toArray(fields[4])),
            createdAt: Utils.toUTF8(fields[5]),
            createdBy: Utils.toUTF8(Utils.toArray(fields[6])),
            tags: fields[7] ? Utils.toUTF8(Utils.toArray(fields[7])).split(",") : undefined,
          };
          posts.push(post);
          break; // one pushdrop per tx for posts
        } else if (type === "reaction") {
          const reaction: Reaction = {
            id: tx.id("hex"),
            type,
            parentPostId: Utils.toUTF8(Utils.toArray(fields[2])),
            directParentId: Utils.toUTF8(Utils.toArray(fields[3])),
            body: Utils.toUTF8(Utils.toArray(fields[4])),
            createdBy: Utils.toUTF8(Utils.toArray(fields[5])),
          };
          reactions.push(reaction);
          break; // one reaction pushdrop per tx
        }
      } catch {
        // not a PushDrop output; continue scanning
      }
    }
  }

  const toTime = (v: string) => {
    const n = Number(v);
    if (Number.isFinite(n)) {
      return v.length === 10 ? n * 1000 : n;
    }
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  posts.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt) || (b.id > a.id ? 1 : -1));

  const reactionsByPostId: Record<string, Reaction[]> = {};
  for (const r of reactions) {
    const key = r.parentPostId ?? r.directParentId; 
    if (!key) continue;
    (reactionsByPostId[key] ??= []).push(r);
  }

  const result = posts.map((post) => {
    const list = (reactionsByPostId[post.id] ?? []).slice();
    return { post, reactions: list };
  });
  return result;
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
      const tx = await Transaction.fromBEEF(output.beef)
      // Scan all outputs to locate the PushDrop output and its type
      let matched = false
      for (const o of tx.outputs) {
        try {
          const decoded = await PushDrop.decode(o.lockingScript as any)
          const fields = decoded.fields
          const type = Utils.toUTF8(Utils.toArray(fields[0]))
          if(type === 'post'){
              post = {
                  id: tx.id('hex'),
                  type: type,
                  topicId: Utils.toUTF8(Utils.toArray(fields[1])),
                  title: Utils.toUTF8(Utils.toArray(fields[2])),
                  uhrpUrl: Utils.toUTF8(Utils.toArray(fields[3])),
                  body: Utils.toUTF8(Utils.toArray(fields[4])),
                  createdAt: Utils.toUTF8(fields[5]),
                  createdBy: Utils.toUTF8(Utils.toArray(fields[6])),
                  tags: fields[7] ? Utils.toUTF8(Utils.toArray(fields[7])).split(',') : undefined,
              }
              matched = true
              break
          }
          else if(type === 'reply'){
              replies.push( {
                  id: tx.id('hex'),
                  type: type,
                  parentPostId: Utils.toUTF8(Utils.toArray(fields[1])),
                  parentReplyId: Utils.toUTF8(Utils.toArray(fields[2])),
                  uhrpUrl: Utils.toUTF8(Utils.toArray(fields[3])),
                  body: Utils.toUTF8(Utils.toArray(fields[4])),
                  createdAt: Utils.toUTF8(fields[5]),
                  createdBy: Utils.toUTF8(Utils.toArray(fields[6])),
              })
              matched = true
              break
          }
          else if(type === 'reaction'){
              reactions.push( {
                   id: tx.id("hex"),
                    type,
                    parentPostId: Utils.toUTF8(Utils.toArray(fields[2])),
                    directParentId: Utils.toUTF8(Utils.toArray(fields[3])),
                    body: Utils.toUTF8(Utils.toArray(fields[4])),
                    createdBy: Utils.toUTF8(Utils.toArray(fields[5])),
              })
              matched = true
              break
          }
        } catch {
          // not a pushdrop output
        }
      }
      if (!matched) {
        // If no pushdrop found, skip this tx entry
        continue
      }
    }
    return {post, replies, reactions}
}