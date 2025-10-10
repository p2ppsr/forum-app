import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { Post, Reply, Reaction } from "../utils/types";
import { fetchPost } from "../utils/forumFetches";
import PostCard from "../components/PostCard";
import { uploadReply } from "../utils/upload";
import FormatReplies from "./FormatReplies";
import InlineReplyComposer from "../components/InlineReplyComposer";

function parseHash() {
  try {
    const raw = (window.location.hash || "").replace(/^#\/?/, "");
    const path = raw.split("?")[0];
    const parts = path.split("/").filter(Boolean); // [topic, 'post', postTxid]
    if (parts.length >= 3 && parts[1] === "post") {
      const topic = decodeURIComponent(parts[0]);
      const postTxid = parts[2];
      return { topic, postTxid };
    }
  } catch {}
  return { topic: "", postTxid: "" };
}

export default function PostReply() {
  const [post, setPost] = useState<Post | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [showPostComposer, setShowPostComposer] = useState<boolean>(false);
  const [composerValue, setComposerValue] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { topic, postTxid } = useMemo(() => parseHash(), []);

  const openReplyForPost = () => {
    setShowPostComposer(true);
    setActiveReplyId(null);
    setComposerValue("");
  };
  const openReplyForReply = (parent: Reply) => {
    setShowPostComposer(false);
    setActiveReplyId(parent.id);
    setComposerValue("");
  };
  const cancelComposer = () => {
    setShowPostComposer(false);
    setActiveReplyId(null);
    setComposerValue("");
  };
  const submitComposer = async () => {
    if (!postTxid) return;
    const parentId = activeReplyId ?? postTxid;
    try {
      setSubmitting(true);
      await uploadReply({
        postTxid,
        parentReplyId: parentId,
        body: composerValue,
      });
      setComposerValue("");
      cancelComposer();
      try {
        const { reactions: r2, replies: repl2 } = await fetchPost(postTxid);
        setReactions(r2);
        setReplies(repl2);
      } catch {}
    } catch {
      console.error("Failed to reply");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!postTxid) return;
      setLoading(true);
      setError(null);
      try {
        const { post, reactions, replies } = await fetchPost(postTxid);

        for (const r of replies) {
          console.log(r);
          console.log(r.id);
        }

        if (alive) {
          setPost(post);
          setReplies(replies);
          setReactions(reactions);
        }
      } catch (e) {
        if (alive) setError("Failed to load post");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [postTxid]);

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Thread
            </Typography>
            <Typography variant="h5" noWrap title={topic}>
              {topic}
            </Typography>
          </Box>
          <Button
            variant="text"
            onClick={() => {
              window.location.hash = `/${encodeURIComponent(topic)}`;
            }}
          >
            Back to Thread
          </Button>
        </Stack>
      </Paper>

      {loading && <Alert severity="info">Loading post…</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {!!post && (
        <>
          <PostCard
            postContext={{ post, reactions }}
            clickable={false}
            truncateBody={false}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", pr: 0.5 }}>
            <Button size="small" onClick={openReplyForPost}>
              Reply
            </Button>
          </Box>
          {showPostComposer && (
            <InlineReplyComposer
              value={composerValue}
              onChange={setComposerValue}
              onCancel={cancelComposer}
              onSubmit={submitComposer}
              submitting={submitting}
            />
          )}
          <FormatReplies
            replies={replies}
            onReply={openReplyForReply}
            activeId={activeReplyId}
            composerValue={composerValue}
            onComposerChange={setComposerValue}
            onCancel={cancelComposer}
            onSubmit={submitComposer}
          />
        </>
      )}
    </Stack>
  );
}
