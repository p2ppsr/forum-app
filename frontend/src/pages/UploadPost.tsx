import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { topicExists } from "../utils/topicExists";
import { uploadPost } from "../utils/upload";

function getTopicFromHash(): string {
  try {
    const hash = window.location.hash || "";
    const qIndex = hash.indexOf("?");
    if (qIndex === -1) return "";
    const params = new URLSearchParams(hash.slice(qIndex + 1));
    return params.get("topic") || "";
  } catch {
    return "";
  }
}

export default function UploadPost() {
  const [tab, setTab] = useState<"text" | "media">("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>(() => getTopicFromHash());

  useEffect(() => {
    const onHash = () => setTopic(getTopicFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const canSubmit = useMemo(
    () => tab === "text" && title.trim() && body.trim(),
    [tab, title, body]
  );

  const onPost = async () => {
    const topicTxid = await getTopicTxid();
    if (!topicTxid) {
      setError("Topic does not exist");
      return;
    }

    await uploadPost({ topicTxid, title, body, tags: [] });

    setStatus("Post submitted (demo)");
    setError(null);
    setTitle("");
    setBody("");
  };

  const getTopicTxid = async () => {
    const topicTxid = await topicExists(topic);
    if (!topicTxid) {
      setError("Topic does not exist");
      return;
    }

    return topicTxid;
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
              Posting in
            </Typography>
            <Typography variant="h5" noWrap title={topic}>
              {topic}
            </Typography>
          </Box>
          <Button
            variant="text"
            onClick={() => (window.location.hash = "/topic")}
          >
            Back to Thread
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Tabs
          value={tab === "text" ? 0 : 1}
          onChange={(_, v) => setTab(v === 0 ? "text" : "media")}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Text" />
          <Tab label="Images & Video" />
        </Tabs>

        {tab === "text" ? (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              inputProps={{ maxLength: 300 }}
              helperText={`${title.length}/300`}
            />
            <TextField
              label="Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              multiline
              minRows={6}
            />
            {status && <Alert severity="info">{status}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                disabled={!canSubmit}
                onClick={onPost}
              >
                Post
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setTitle("");
                  setBody("");
                  setStatus("");
                  setError(null);
                }}
              >
                Clear
              </Button>
            </Box>
          </Stack>
        ) : (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">Images & Video — Coming Soon</Alert>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
