export type EmojiItem = {
  char: string;
  name: string;
  keywords?: string[];
  category?: string;
};

export const EMOJI_DATA: EmojiItem[] = [
  // Faces
  { char: "😀", name: "grinning face", keywords: ["smile","happy","joy"], category: "faces" },
  { char: "😁", name: "beaming face", keywords: ["smile","grin"], category: "faces" },
  { char: "😂", name: "face with tears of joy", keywords: ["lol","funny"], category: "faces" },
  { char: "🤣", name: "rolling on the floor laughing", keywords: ["rofl"], category: "faces" },
  { char: "🙂", name: "slightly smiling face", keywords: ["smile"], category: "faces" },
  { char: "😉", name: "winking face", keywords: ["wink"], category: "faces" },
  { char: "😊", name: "smiling face with smiling eyes", keywords: ["blush","happy"], category: "faces" },
  { char: "😍", name: "smiling face with heart-eyes", keywords: ["love","crush"], category: "faces" },
  { char: "😘", name: "face blowing a kiss", keywords: ["kiss","love"], category: "faces" },
  { char: "😎", name: "smiling face with sunglasses", keywords: ["cool"], category: "faces" },
  { char: "😭", name: "loudly crying face", keywords: ["sad","cry"], category: "faces" },
  { char: "😢", name: "crying face", keywords: ["sad"], category: "faces" },
  { char: "😡", name: "enraged face", keywords: ["angry","mad"], category: "faces" },
  { char: "😱", name: "face screaming in fear", keywords: ["shock","scared"], category: "faces" },
  { char: "🤔", name: "thinking face", keywords: ["think","hmm"], category: "faces" },
  { char: "🙃", name: "upside-down face", keywords: ["sarcasm"], category: "faces" },
  { char: "🥲", name: "smiling face with tear", keywords: ["bittersweet"], category: "faces" },
  // Hands
  { char: "👍", name: "thumbs up", keywords: ["like","approve","upvote"], category: "hands" },
  { char: "👎", name: "thumbs down", keywords: ["dislike","downvote"], category: "hands" },
  { char: "👏", name: "clapping hands", keywords: ["applause","bravo"], category: "hands" },
  { char: "🙏", name: "folded hands", keywords: ["pray","thanks"], category: "hands" },
  { char: "🙌", name: "raising hands", keywords: ["hooray","celebrate"], category: "hands" },
  { char: "👀", name: "eyes", keywords: ["look","watching"], category: "hands" },
  // Symbols
  { char: "❤️", name: "red heart", keywords: ["love","heart"], category: "symbols" },
  { char: "💔", name: "broken heart", keywords: ["sad","breakup"], category: "symbols" },
  { char: "🔥", name: "fire", keywords: ["lit","hot"], category: "symbols" },
  { char: "✨", name: "sparkles", keywords: ["shine","magic"], category: "symbols" },
  { char: "🎉", name: "party popper", keywords: ["celebration","congrats"], category: "symbols" },
  { char: "💯", name: "hundred points", keywords: ["100","keep it 100"], category: "symbols" },
  { char: "😮", name: "face with open mouth", keywords: ["surprised","wow"], category: "faces" },
  // Add more as needed…
];

// Quick text match helper
export function filterEmoji(query: string): EmojiItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return EMOJI_DATA;
  return EMOJI_DATA.filter(e =>
    e.name.toLowerCase().includes(q) ||
    (e.keywords ?? []).some(k => k.toLowerCase().includes(q))
  );
}