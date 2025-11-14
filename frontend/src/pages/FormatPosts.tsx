import { Stack } from "@mui/material";
import PostCard from "../components/PostCard";
import type { PostContext } from "../utils/types";

type Props = {
  posts: PostContext[];
};

export default function FormatPosts({ posts }: Props) {
  return (
    <Stack spacing={2}>
      {posts.map((p) => (
        <PostCard key={p.post.id} postContext={p} clickable={true}/>
      ))}
    </Stack>
  );
}
