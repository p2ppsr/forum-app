import { Stack } from "@mui/material";
import TopicCard from "../components/TopicCard";
import type { Topic } from "../utils/types";
type TopicsPageProps = {
  topics: Topic[];
  onCreateClick: () => void;
};

export default function TopicsPage({ topics }: TopicsPageProps) {
  return (
    <Stack spacing={2}>
      {topics.map((t) => (
        <TopicCard key={t.id} topic={t} />
      ))}
    </Stack>
  );
}