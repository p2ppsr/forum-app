import { Card, CardActionArea, CardActions, CardContent, CardHeader, Chip, Button, Stack, Typography } from "@mui/material";
import type { Post, Reaction, PostContext } from "../utils/types";
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { fetchPost } from "../utils/forumFetches";
import { uploadReaction } from "../utils/upload";

export default function PostCard({ postContext, clickable = true, truncateBody = true }: { postContext: PostContext; clickable?: boolean; truncateBody?: boolean }) {
  const date = new Date(postContext.post.createdAt);

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
        const { reactions } = await fetchPost(postContext.post.id);
        const count = reactions.filter(r => (r.body || "").toLowerCase() === "like").length;
        if (alive) setLikeCount(count);
      } catch {
        console.error("Failed to fetch post reactions");
        if (alive) setLikeCount(0);
      }
    })();
    return () => { alive = false; };
  }, [postContext.post.id]);

  const onLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    try {
      setLiking(true);
      console.log('post : ',postContext.post)
      await uploadReaction({ topic_txid: postContext.post.topicId, parentPostTxid: postContext.post.id, directParentTxid: postContext.post.id, reaction: "like" });
      setLikeCount(c => c + 1);
    } catch {
      console.error("Failed to like post");
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
    window.location.hash = `/${encodeURIComponent(topic)}/post/${postContext.post.id}`;
  };
  const content = (
    <>
      <CardHeader
        title={
          <Typography variant="h6" noWrap title={postContext.post.title}>
            {postContext.post.title}
          </Typography>
        }
        subheader={date.toLocaleString()}
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={
            truncateBody
              ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", mb: postContext.post.tags?.length ? 1 : 0 }
              : { whiteSpace: "pre-wrap", mb: postContext.post.tags?.length ? 1 : 0 }
          }
        >
          {postContext.post.body}
        </Typography>
        {(!!postContext.post.tags?.length && postContext.post.tags.length < 0) && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {postContext.post.tags.map((tag) => (
              <Chip key={tag} size="small" label={tag} variant="outlined" />)
            )}
          </Stack>
        )}
      </CardContent>
    </>
  );

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      {clickable ? (
        <CardActionArea onClick={onOpenPost}>{content}</CardActionArea>
      ) : (
        content
      )}
      <CardActions sx={{ justifyContent: "space-between", pt: 0 }}>
        <Button size="small" onClick={onLike} disabled={liking}>
          {`♥ ${likeCount}`}
        </Button>
        <Button size="small" onClick={onMore}>Reactions</Button>
      </CardActions>
    </Card>
  );
}
