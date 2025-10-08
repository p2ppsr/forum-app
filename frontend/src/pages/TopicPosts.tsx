import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import PostCard from "../components/PostCard";
import type { UIPost } from "../components/PostCard";

export default function TopicPosts({ posts = [], onCreatePostClick }: { posts?: UIPost[]; onCreatePostClick?: () => void }) {
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">DEFAULT</Typography>
          <Button variant="contained" onClick={onCreatePostClick}>Create Post</Button>
        </Stack>
      </Paper>

      {posts.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Stack spacing={1}>
            <Typography variant="h6">No posts yet</Typography>
            <Typography variant="body2" color="text.secondary">Be the first to post to this thread.</Typography>
          </Stack>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {posts.map((p) => (
            <Box key={p.id}>
              <PostCard post={p} />
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}
