export interface forumQuery {
  query: 'getallTopics' | 'getPost' | 'getallPosts' 
  parameters?: string
}
export interface Topic {
  type: string
  title: string
  description: string
  created_at: string
}
export interface Post {
  type: string
  topicID: string
  title: string
  body: string
}
export interface Reply {
  type: string
  parent_postID: string
  parent_replyID?: string
  body: string
  created_at: string
}
export interface Reaction {
  type: string
  p_r_txid?: string
  body: string
  created_by: string
  parent_postID: string
}