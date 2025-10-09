import { Stack } from "@mui/material";
import type { Reply } from "../utils/types";
import ReplyCard, { type ReplyNode } from "../components/ReplyCard";

function buildReplyTree(replies: Reply[]): ReplyNode[] {
  const nodes: Record<string, ReplyNode> = {};
  const roots: ReplyNode[] = [];

  // initialize nodes
  for (const r of replies) {
    nodes[r.id] = { reply: r, children: [] };
  }

  for (const r of replies) {
    const parentReplyId = r.parentReplyId;
    if (parentReplyId && nodes[parentReplyId]) {
      nodes[parentReplyId].children.push(nodes[r.id]);
    } else if (r.parentPostId) {
      // direct child of the post -> root level in the tree
      roots.push(nodes[r.id]);
    } else {
      // fallback: if structure is incomplete, still show at root
      roots.push(nodes[r.id]);
    }
  }

  return roots;
}

export default function FormatReplies({ replies, onReply }: { replies: Reply[]; onReply?: (parent: Reply) => void }) {
  const tree = buildReplyTree(replies);
  return (
    <Stack spacing={1}>
      {tree.map((n) => (
        <ReplyCard key={n.reply.id} node={n} onReply={onReply} />
      ))}
    </Stack>
  );
}
