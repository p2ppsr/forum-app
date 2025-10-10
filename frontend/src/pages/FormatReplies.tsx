import { Stack } from "@mui/material";
import type { Reply } from "../utils/types";
import ReplyCard, { type ReplyNode } from "../components/ReplyCard";

function toTime(v: string): number {
  const n = Number(v);
  if (Number.isFinite(n)) return v.length === 10 ? n * 1000 : n;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
}

function buildReplyTree(replies: Reply[]): ReplyNode[] {
  const nodes: Record<string, ReplyNode> = {};
  const roots: ReplyNode[] = [];

  // create node shells
  for (const r of replies) {
    nodes[r.id] = { reply: r, children: [] };
  }

  // link children and set parent pointers
  for (const r of replies) {
    const node = nodes[r.id];
    const parentReplyId = r.parentReplyId;
    if (parentReplyId && nodes[parentReplyId]) {
      const parent = nodes[parentReplyId];
      node.parent = parent;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // sort roots and children by createdAt (ascending, like Reddit default chronological per thread)
  const sortByTime = (a: ReplyNode, b: ReplyNode) => toTime(a.reply.createdAt) - toTime(b.reply.createdAt) || (a.reply.id > b.reply.id ? 1 : -1);
  const sortTree = (list: ReplyNode[]) => {
    list.sort(sortByTime);
    for (const n of list) {
      if (n.children.length) sortTree(n.children);
    }
  };
  sortTree(roots);

  return roots;
}

export default function FormatReplies({
  replies,
  onReply,
  activeId,
  composerValue,
  onComposerChange,
  onCancel,
  onSubmit,
}: {
  replies: Reply[];
  onReply?: (parent: Reply) => void;
  activeId?: string | null;
  composerValue?: string;
  onComposerChange?: (v: string) => void;
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  const tree = buildReplyTree(replies);
  return (
    <Stack spacing={1}>
      {tree.map((n) => (
        <ReplyCard
          key={n.reply.id}
          node={n}
          onReply={onReply}
          activeId={activeId}
          composerValue={composerValue}
          onComposerChange={onComposerChange}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      ))}
    </Stack>
  );
}
