import { Card, CardContent, CardHeader, Typography } from "@mui/material";

export interface UITopic {
  id: string;
  title: string;
  description: string;
  createdAt: number;
}

export default function TopicCard({ topic }: { topic: UITopic }) {
  const date = new Date(topic.createdAt);
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Typography variant="h6" noWrap title={topic.title}>
            {topic.title}
          </Typography>
        }
        subheader={date.toLocaleString()}
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {topic.description}
        </Typography>
      </CardContent>
    </Card>
  );
}
