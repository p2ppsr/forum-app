import { Box, Button, Stack, TextField } from "@mui/material";

export default function InlineReplyComposer({
  value,
  onChange,
  onCancel,
  onSubmit,
  submitting = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  const canSubmit = value.trim().length > 0 && !submitting;
  return (
    <Box sx={{ mt: 1 }}>
      <Stack spacing={1.5}>
        <TextField
          label="Write your reply"
          placeholder="Share your thoughts…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button variant="text" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={onSubmit} disabled={!canSubmit}>
            Post
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
