// src/emoji/ReactionBar.tsx
import { useMemo, useState } from "react";
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
import constants from "../constants";
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

  const getEmojiPrice = (emoji: string): number | undefined => {
    const raw = emoji || "";
    if (!raw) return undefined;
    const base = raw
      .replace(/\uFE0F/g, "")
      .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "");
    const prices = constants.emojiPrices as Record<string, number>;
    if (Object.prototype.hasOwnProperty.call(prices, raw)) return prices[raw];
    if (Object.prototype.hasOwnProperty.call(prices, base)) return prices[base];
    return undefined;
  };

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
        {sorted.map(([emoji, n]) => {
          const price = getEmojiPrice(emoji);
          const title = price ? `${emoji} • ${price} sats` : emoji;
          return (
            <Tooltip key={emoji} title={title} arrow>
              <Chip
                size="small"
                label={`${emoji} ${n}`}
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleReact(emoji);
                }}
                sx={{ cursor: "pointer" }}
              />
            </Tooltip>
          );
        })}

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