// src/emoji/ReactionBar.tsx
import { useMemo, useState } from "react";
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import EmojiPickerPopover from "./EmojiModal";

export type ReactionCounts = Record<string, number>;

export default function ReactionBar({
  counts,
  onReact,
  disablePicker = false,
  maxChips = 10,
}: {
  counts: ReactionCounts;
  onReact: (emoji: string) => Promise<void> | void;
  disablePicker?: boolean;
  maxChips?: number;
}) {
  const [local, setLocal] = useState<ReactionCounts>(counts);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useMemo(() => setLocal(counts), [counts]);

  const sorted = useMemo(
    () =>
      Object.entries(local)
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, maxChips),
    [local, maxChips]
  );

  const bump = (emoji: string, delta: number) =>
    setLocal((c) => ({ ...c, [emoji]: Math.max(0, (c[emoji] || 0) + delta) }));

  const handleReact = async (emoji: string) => {
    bump(emoji, +1);
    try {
      await onReact(emoji);
    } catch {
      bump(emoji, -1);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        {sorted.map(([emoji, n]) => (
          <Chip
            key={emoji}
            size="small"
            label={`${emoji} ${n}`}
            variant="outlined"
            onClick={(e) => { e.stopPropagation(); void handleReact(emoji); }}
            sx={{ cursor: "pointer" }}
          />
        ))}

        {!disablePicker && (
          <>
            <Tooltip title="Add reaction">
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
              >
                <AddReactionIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <EmojiPickerPopover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              onPick={(emoji) => { setAnchorEl(null); void handleReact(emoji); }}
            />
          </>
        )}
      </Stack>
    </>
  );
}