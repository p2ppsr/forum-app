// TODO add the fields of the outputs and any other keys that you want to store on the database
export interface ForumRecord {
  txid: string
  outputIndex: number  
  createdAt: Date   // Used as an example
  topicID?: string  // Used as an example
  parent_postID?: string
}

// Used to identify a UTXO that is admitted by the Topic Manager
export interface UTXOReference {
  txid: string
  outputIndex: number
}

export interface Metadata {
  field1: string
  field2?: string
}

export interface forumQuery {
  query: string
  parameters?: any
}