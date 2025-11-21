import { useEffect, useMemo, useRef, useState } from "react";
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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onHash = () => setTopic(getTopicFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!mediaFile) {
      setMediaPreview(null);
      return;
    }

    const url = URL.createObjectURL(mediaFile);
    setMediaPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [mediaFile]);

  const canSubmit = useMemo(
    () =>
      tab === "text"
        ? Boolean(title.trim() && body.trim())
        : Boolean(title.trim() && mediaFile),
    [tab, title, body, mediaFile]
  );

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setMediaFile(null);
      return;
    }

    if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      setError("Only image or video files are supported.");
      setMediaFile(null);
      return;
    }

    setError(null);
    setMediaFile(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onPost = async () => {
    const topicTxid = await getTopicTxid();
    if (!topicTxid) {
      setError("Topic does not exist");
      return;
    }

    if (tab === "text") {
      await uploadPost({
        topicTxid,
        title,
        body,
        file: null,
        tags: [],
      });
    } else {
      if (!mediaFile) {
        setError("Please select an image or video to upload.");
        return;
      }
      await uploadPost({
        topicTxid,
        title,
        body,
        file: mediaFile,
        tags: [],
      });
    }

    const target = topic ? `/${encodeURIComponent(topic)}` : "/home";
    window.location.hash = target;
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
            onClick={() => {
              const target = topic ? `/${encodeURIComponent(topic)}` : "/home";
              window.location.hash = target;
            }}
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
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              inputProps={{ maxLength: 300 }}
              helperText={`${title.length}/300`}
            />
            <Typography variant="body2" color="text.secondary">
              Add flair and tags (optional)
            </Typography>
            <Box
              sx={{
                mt: 1,
                p: 3,
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => {
                fileInputRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const file = event.dataTransfer.files?.[0] ?? null;
                handleFileSelect(file);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  handleFileSelect(file);
                }}
              />
              {mediaPreview && mediaFile ? (
                <Stack spacing={1} alignItems="center">
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: 480,
                      borderRadius: 1,
                      overflow: "hidden",
                      bgcolor: undefined,
                      "&::before": {
                        content: '""',
                        display: "block",
                        paddingTop: "56.25%",
                      },
                    }}
                  >
                    {mediaFile.type.startsWith("image/") ? (
                      <Box
                        component="img"
                        src={mediaPreview}
                        alt={mediaFile.name}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Box
                        component="video"
                        src={mediaPreview}
                        controls
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {mediaFile.name}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={(event) => {
                      event.stopPropagation();
                      clearMedia();
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={1} alignItems="center">
                  <CloudUploadIcon color="action" />
                  <Typography variant="body2">
                    Drag and drop or click to upload media
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Images or video files
                  </Typography>
                </Stack>
              )}
            </Box>
            <TextField
              label="Body text (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              minRows={4}
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
                  clearMedia();
                }}
              >
                Clear
              </Button>
            </Box>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
