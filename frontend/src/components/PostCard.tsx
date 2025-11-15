import {
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { PostContext } from "../utils/types";
import { useMemo } from "react";
import { uploadReactionWithFee } from "../utils/upload";
import constants from "../constants";
import ReactionBar, { type ReactionCounts } from "../emoji/ReactionBar";

const normalizeReaction = (s?: string) => {
  const v = (s || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "like" || v === "heart") return "❤️"; // map legacy likes to heart
  return s!; // pass through emoji or custom string
};

function toTime(v: string): number {
  const n = Number(v);
  if (Number.isFinite(n)) return v.length === 10 ? n * 1000 : n;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function PostCard({
  postContext,
  clickable = true,
  truncateBody = true,
}: {
  postContext: PostContext;
  clickable?: boolean;
  truncateBody?: boolean;
}) {
  const dateString = useMemo(
    () => new Date(toTime(postContext.post.createdAt)).toLocaleString(),
    [postContext.post.createdAt]
  );

  // derive current topic from the URL for deep-link navigation
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

  // Aggregate reaction counts from postContext
  const counts: ReactionCounts = useMemo(() => {
    const acc: ReactionCounts = {};
    for (const r of postContext.reactions) {
      const key = normalizeReaction(r.body);
      if (!key) continue;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, [postContext.reactions]);

  const cleanedTags = useMemo(
    () =>
      (postContext.post.tags ?? [])
        .map((t) => (t ?? "").replace(/[\x00-\x1F\x7F]/g, "").trim())
        .filter(Boolean),
    [postContext.post.tags]
  );

  const onOpenPost = () => {
    if (!clickable) return;
    const topic = topicFromHash;
    if (!topic) return;
    window.location.hash = `/${encodeURIComponent(topic)}/post/${postContext.post.id}`;
  };

  // Send a reaction to chain (ReactionBar does optimistic UI internally)
  const onReact = async (emoji: string) => {
    const feeKey = (constants.reactionFeePublicKey || "").trim();
    const feeSats = Number(constants.reactionFeeSatoshis || 0);

    await uploadReactionWithFee({
      topic_txid: postContext.post.topicId,
      parentPostTxid: postContext.post.id,
      directParentTxid: postContext.post.id,
      reaction: emoji,
      feeRecipientPublicKey: feeKey,
      feeSatoshis: Number.isFinite(feeSats) && feeSats > 0 ? feeSats : 0,
      recipientPublicKey: (postContext.post.createdBy || '').trim(),
    });
  };

  const content = (
    <>
      <CardHeader
        title={
          <Typography variant="h6" noWrap title={postContext.post.title}>
            {postContext.post.title}
          </Typography>
        }
        subheader={dateString}
        sx={{ pb: 0 }}
      />

      <CardContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={
            truncateBody
              ? {
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  mb: cleanedTags.length ? 1 : 0,
                }
              : {
                  whiteSpace: "pre-wrap",
                  mb: cleanedTags.length ? 1 : 0,
                }
          }
        >
          {postContext.post.body}
        </Typography>

        {cleanedTags.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {cleanedTags.map((tag) => (
              <Chip key={tag} size="small" label={tag} variant="outlined" />
            ))}
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

      {/* Reactions */}
      <CardActions sx={{ justifyContent: "space-between", pt: 0, px: 2, pb: 1.5 }}>
        <ReactionBar counts={counts} onReact={onReact} />
      </CardActions>
    </Card>
  );
}