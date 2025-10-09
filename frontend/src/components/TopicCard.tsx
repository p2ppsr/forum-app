// components/TopicCard.tsx
import { Card, CardContent, CardHeader, Typography, CardActionArea, Box } from "@mui/material";
import type { Topic } from "../utils/types";

export default function TopicCard({ topic }: { topic: Topic }) {
  const created =
    Number.isFinite(Number(topic.createdAt)) && topic.createdAt.length < 15
      ? new Date(Number(topic.createdAt)).toLocaleString()
      : new Date(topic.createdAt).toLocaleString();

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea
        component="a"
        href={`#/${encodeURIComponent(topic.title)}`} // ← exact title in URL
        sx={{ height: "100%", alignItems: "stretch" }}
        aria-label={`Open topic: ${topic.title}`}
      >
        <CardHeader
          title={<Typography variant="h6" noWrap title={topic.title} sx={{ fontWeight: 700 }}>{topic.title}</Typography>}
          subheader={
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                whiteSpace: "normal",
                fontStyle: "italic",
              }}
              title={topic.description}
            >
              {topic.description ?? ""}
            </Typography>
          }
          sx={{ pb: 0.5 }}
        />
        <CardContent sx={{ pt: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {created}{topic.createdBy ? ` • by ${topic.createdBy}` : ""}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}