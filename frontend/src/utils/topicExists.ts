import type { LookupQuestion } from '@bsv/overlay'
import { LookupResolver } from '@bsv/sdk'
import type{ forumQuery } from './types'
import constants from '../constants.js'


export async function topicExists( topicTitle: string ): Promise<boolean> 
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

    if(lookupResult.type !== 'output-list'){
        throw new Error('Unexpected response from lookup service')
    }
    if(lookupResult.outputs.length > 0){
        return true;
    }
    return false;
}