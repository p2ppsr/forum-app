import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import PostCard from "../components/PostCard";
import type { Post, Topic } from "../utils/types";

type Props = {
  topic?: Topic | null;          // 👈 pass the current topic in
  posts?: Post[];
  onCreatePostClick?: () => void;
};

export default function TopicPosts({ topic, posts = [], onCreatePostClick }: Props) {
  // Fallback: show the slug from the URL if no topic object provided
  const urlSlug = decodeURIComponent((window.location.hash.replace(/^#\//, "").split("?")[0]) || "");

  const created =
    topic?.createdAt
      ? (Number.isFinite(Number(topic.createdAt)) && topic.createdAt.length < 15
          ? new Date(Number(topic.createdAt)).toLocaleString()
          : new Date(topic.createdAt).toLocaleString())
      : "";

    

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* Title (from topic if available, else fallback to slug) */}
          <Box sx={{ minWidth: 0, mr: 2 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, lineHeight: 1.2, wordBreak: "break-word" }}
              title={topic?.title ?? urlSlug}
            >
              {topic?.title ?? urlSlug}
            </Typography>

            {/* 🔁 Description replaces "DEFAULT" */}
            {!!topic?.description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 0.5, fontStyle: "italic", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {topic.description}
              </Typography>
            )}

            {/* Meta line */}
            {!!topic && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {created}{topic.createdBy ? ` • by ${topic.createdBy}` : ""}
              </Typography>
            )}
          </Box>

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