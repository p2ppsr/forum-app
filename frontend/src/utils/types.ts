export interface forumQuery {
  query: 'getAllTopics' | 'getPost' | 'getAllPosts' 
  parameters?: string
}
export interface Topic {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  created_by?: string
}
export interface Post {
  id: string
  type: string
  topicID: string
  title: string
  body: string
  created_at: string
  created_by?: string
  tags?: string[]
}
export interface Reply {
  id: string
  type: string
  parent_postID: string
  parent_replyID?: string
  body: string
  created_at: string
  created_by?: string
}
export interface Reaction {
  id: string
  type: string
  p_r_txid?: string
  body: string
  created_by: string
  parent_postID: string
}