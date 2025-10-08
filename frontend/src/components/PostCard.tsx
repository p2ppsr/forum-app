import { Card, CardContent, CardHeader, Chip, Stack, Typography } from "@mui/material";

export interface UIPost {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  createdBy?: string;
  tags?: string[];
}

export default function PostCard({ post }: { post: UIPost }) {
  const date = new Date(post.createdAt);
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardHeader
        title={
          <Typography variant="h6" noWrap title={post.title}>
            {post.title}
          </Typography>
        }
        subheader={date.toLocaleString()}
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", mb: post.tags?.length ? 1 : 0 }}
        >
          {post.body}
        </Typography>
        {!!post.tags?.length && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {post.tags.map((tag) => (
              <Chip key={tag} size="small" label={tag} variant="outlined" />)
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
