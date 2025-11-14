// TODO add the fields of the outputs and any other keys that you want to store on the database
export interface ForumRecord {
  txid: string
  outputIndex: number  
  createdAt: Date   // Used as an example
  topicID?: string  // Used as an example
  parent_postID?: string
  topicTitle?: string
  emoji?: string
  createdBy?: string
  recipient?: string
  payoutSats?: number
}

// Used to identify a UTXO that is admitted by the Topic Manager
export interface UTXOReference {
  txid: string
  outputIndex: number
}

export interface Metadata {
  field1: string
  field2?: string
  field3?: string
  field4?: string
  field5?: string
  payoutSats?: number
}

export interface forumQuery {
  query: string
  parameter?: any
}