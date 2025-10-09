import { Popover, Box, TextField } from "@mui/material";
import { useMemo, useState } from "react";
import { filterEmoji } from './Emoji'

export default function EmojiPickerPopover({
  open,
  anchorEl,
  onClose,
  onPick,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onPick: (emoji: string) => void;
}) {
  const [query, setQuery] = useState("");
  const list = useMemo(() => filterEmoji(query), [query]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { sx: { p: 1, width: 320 } } }}
      onClick={(e) => e.stopPropagation()}
    >
      <TextField
        size="small"
        fullWidth
        autoFocus
        placeholder="Search emoji…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: 0.5,
          maxHeight: 300,
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        {list.map((e: any) => (
          <button
            key={e.char + e.name}
            onClick={() => { onPick(e.char); onClose(); }}
            style={{
              fontSize: 20,
              lineHeight: 1.2,
              padding: 6,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
            title={e.name}
          >
            {e.char}
          </button>
        ))}
      </Box>
    </Popover>
  );
}