import { Card, CardActionArea, CardActions, CardContent, CardHeader, Chip, Button, Stack, Typography } from "@mui/material";
import type { Post } from "../utils/types";
import { useEffect, useMemo, useState } from "react";
import { fetchPost } from "../utils/forumFetches";
import { uploadReaction } from "../utils/upload";

export default function PostCard({ post, clickable = true }: { post: Post; clickable?: boolean }) {
  const date = new Date(post.createdAt);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liking, setLiking] = useState<boolean>(false);

  const topicFromHash = useMemo(() => {
    try {
      const raw = (window.location.hash || "").replace(/^#\/?/, "");
      const path = raw.split("?")[0];
      const [topic] = path.split("/");
      return decodeURIComponent(topic || "");
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { reactions } = await fetchPost(post.id);
        const count = reactions.filter(r => (r.body || "").toLowerCase() === "like").length;
        if (alive) setLikeCount(count);
      } catch {
        if (alive) setLikeCount(0);
      }
    })();
    return () => { alive = false; };
  }, [post.id]);

  const onLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    try {
      setLiking(true);
      await uploadReaction({ topic_txid: post.topicId, parentPostTxid: post.id, directParentTxid: post.id, reaction: "like" });
      setLikeCount(c => c + 1);
    } catch {
      // swallow for now
    } finally {
      setLiking(false);
    }
  };

  const onMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    // placeholder: future reactions panel
  };

  const onOpenPost = () => {
    if (!clickable) return;
    const topic = topicFromHash;
    if (!topic) return;
    window.location.hash = `/${encodeURIComponent(topic)}/post/${post.id}`;
  };
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea onClick={onOpenPost}>
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
          {(!!post.tags?.length && post.tags.length < 0) && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {post.tags.map((tag) => (
                <Chip key={tag} size="small" label={tag} variant="outlined" />)
              )}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ justifyContent: "space-between", pt: 0 }}>
        <Button size="small" onClick={onLike} disabled={liking}>
          {`♥ ${likeCount}`}
        </Button>
        <Button size="small" onClick={onMore}>Reactions</Button>
      </CardActions>
    </Card>
  );
}
