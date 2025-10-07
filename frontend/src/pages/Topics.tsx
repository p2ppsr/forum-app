import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import TopicCard from "../components/TopicCard";
import type { UITopic } from "../components/TopicCard";

export default function TopicsPage({ topics, onCreateClick }: { topics: UITopic[]; onCreateClick: () => void }) {
  if (!topics || topics.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h6">No topics yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to start a conversation by creating a new topic.
          </Typography>
          <Button variant="contained" onClick={onCreateClick}>
            Create Topic
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "grid", gridForumColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
      {topics.map((t) => (
        <Box key={t.id}>
          <TopicCard topic={t} />
        </Box>
      ))}
    </Box>
  );
}
