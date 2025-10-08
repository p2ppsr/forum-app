import { useMemo, useState, type FormEvent } from "react";
import { uploadTopic } from "./utils/upload";
import { Alert, Box, Button, Paper, Stack, TextField, Typography, LinearProgress } from "@mui/material";
import type { Topic } from "./utils/types";
import { topicExists } from "./utils/topicExists";
export default function Upload({ onTopicCreated }: { onTopicCreated?: (t: Topic) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => title.trim().length > 0 && description.trim().length > 0 && !submitting, [title, description, submitting]);

  const onSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const createdAt = Date.now();
    try {
      // Inform parent so Home can optimistically show the new topic
      console.log('trimmed title:',title.trim(), 'pretrimmed title:',title);
      let topicAlreadyExists = await topicExists(title.trim());
      if(topicAlreadyExists === undefined)
      {
        await uploadTopic({ title: title.trim(), description: description.trim(), setStatusText: setStatus });
        onTopicCreated?.({ id: `temp:${createdAt}`, title: title.trim(), description: description.trim(), createdAt: createdAt.toString(), type:'topic' });
        setStatus("Done.");
        setTitle("");
        setDescription("");
      }
        else{
          setError("Topic with this title already exists. Please choose a different title.");
        }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          <Typography variant="h6">Create a topic</Typography>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            inputProps={{ maxLength: 120 }}
            helperText={`${title.length}/120`}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            multiline
            minRows={4}
          />
          {submitting && <LinearProgress />}
          {status && <Alert severity="info">{status}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button type="submit" variant="contained" disabled={!canSubmit}>
              Post topic
            </Button>
            <Button type="button" variant="text" disabled={submitting} onClick={() => { setTitle(""); setDescription(""); setStatus(""); setError(null); }}>
              Clear
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
}
