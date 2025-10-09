import { Stack } from "@mui/material";
import PostCard from "../components/PostCard";
import type { Post } from "../utils/types";

type Props = {
  posts: Post[];
};

export default function FormatPosts({ posts }: Props) {
  return (
    <Stack spacing={2}>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </Stack>
  );
}
