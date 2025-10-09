import { Box, Button, Collapse, Paper, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useMemo, useState } from "react";
import type { Reply } from "../utils/types";

export type ReplyNode = {
  reply: Reply;
  children: ReplyNode[];
};

function toTime(v: string): number {
  const n = Number(v);
  if (Number.isFinite(n)) return v.length === 10 ? n * 1000 : n;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function ReplyCard({
  node,
  depth = 0,
  onReply,
}: {
  node: ReplyNode;
  depth?: number;
  onReply?: (parent: Reply) => void;
}) {
  const { reply, children } = node;
  const dateString = useMemo(() => new Date(toTime(reply.createdAt)).toLocaleString(), [reply.createdAt]);
  const [expanded, setExpanded] = useState(true);

  return (
    <Stack spacing={1} sx={{ ml: depth === 0 ? 0 : 2 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        {depth > 0 && (
          <Box sx={{ width: 8, mr: 1, borderLeft: "2px solid", borderColor: "divider", minHeight: "100%" }} />
        )}
        <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {reply.createdBy ? `${reply.createdBy} • ` : ""}{dateString}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {reply.body}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {!!onReply && (
                <Button size="small" onClick={() => onReply(reply)}>Reply</Button>
              )}
              {!!children.length && (
                <Button size="small" onClick={() => setExpanded(e => !e)} startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon /> }>
                  {expanded ? "Hide" : "Show"} {children.length} repl{children.length === 1 ? "y" : "ies"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      {!!children.length && (
        <Collapse in={expanded} unmountOnExit timeout="auto">
          <Stack spacing={1} sx={{ mt: 1 }}>
            {children.map((child) => (
              <ReplyCard key={child.reply.id} node={child} depth={depth + 1} onReply={onReply} />
            ))}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
}
