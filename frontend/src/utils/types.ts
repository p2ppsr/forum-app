export interface forumQuery {
  query: 'getAllTopics' | 'getPost' | 'getAllPosts' | 'getTopic' 
  parameter?: string
}
export interface PostContext{
  post: Post;
  reactions: Reaction[];
}

export interface Topic {
  id: string
  type: string
  title: string
  description: string
  createdAt: string
  createdBy: string
}
export interface Post {
  id: string
  type: string
  topicId: string
  title: string
  body: string
  createdAt: string
  createdBy: string
  tags?: string[]
  preEditId?: string
}
export interface Reply {
  id: string
  type: string
  parentPostId: string
  parentReplyId?: string
  body: string
  createdAt: string
  createdBy: string
  preEditId?: string
}
export interface Reaction {
  id: string
  type: string
  directParentId?: string
  body: string
  createdBy: string
  parentPostId: string
}