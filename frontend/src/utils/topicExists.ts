import type { LookupQuestion } from '@bsv/overlay'
import { LookupResolver } from '@bsv/sdk'
import type{ forumQuery } from './types'
import constants from '../constants.js'
import { Transaction } from '@bsv/sdk'

export async function topicExists( topicTitle: string ): Promise<string| undefined> 
{
    console.log('titolo esiste:',topicTitle);
    let query = {
    query: 'getTopic',
    parameter: topicTitle
    } as forumQuery

    let question = {
    service: constants.lookupService,
    query: query} as LookupQuestion
    const resolver = new LookupResolver({networkPreset:
      window.location.hostname === "localhost" ? "local" : "mainnet",})
    const lookupResult = await resolver.query(question)
    const parsedTransaction = await Transaction.fromBEEF(lookupResult.outputs[0].beef)
    if(lookupResult.type !== 'output-list'){
        throw new Error('Unexpected response from lookup service')
    }
    if(lookupResult.outputs.length > 0){
        return parsedTransaction.id('hex')
    }
    return undefined;
}