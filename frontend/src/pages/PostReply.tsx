import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { Post, Reply, Reaction } from "../utils/types";
import { fetchPost } from "../utils/forumFetches";
import PostCard from "../components/PostCard";
import { uploadReply } from "../utils/upload";
import FormatReplies from "./FormatReplies";

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
  const [replyText, setReplyText] = useState<string>("");

  const canSubmit = useMemo(() => replyText.trim().length > 0, [replyText]);

  const { topic, postTxid } = useMemo(() => parseHash(), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!postTxid) return;
      setLoading(true);
      setError(null);
      try {
        const { post, reactions, replies } = await fetchPost(postTxid);

        console.log(replies)
        
        if (alive) {setPost(post)
          setReplies(replies);
          setReactions(reactions);
        };

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

  const onReply = async () => {
    if (!postTxid) return;
    try {
      await uploadReply({
        postTxid: postTxid,
        parentReplyId: postTxid,
        body: replyText,
      });
      setReplyText("");
    } catch {
      console.error("Failed to reply");
    }
  };

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
        <PostCard postContext={{ post, reactions }} clickable={false} truncateBody={false} />
        <FormatReplies replies={replies} />
        </>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Reply
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Write your reply"
            placeholder="Share your thoughts…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" disabled={!canSubmit} onClick={onReply}>
              Reply
            </Button>
            <Button variant="text" onClick={() => setReplyText("")}>
              Clear
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
