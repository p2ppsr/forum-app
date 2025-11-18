import type { SecurityLevel } from "@bsv/sdk" 
  interface Constants {
    protocolId: string,
    securityProtocol: SecurityLevel
    topicManager: string,
    lookupService: string,
    emojiPrices: Record<string, number>
  }
  let constants: Constants = { 
    protocolId: "blockit" ,
    securityProtocol: 1,
    topicManager: "tm_blockit",
    lookupService: "ls_blockit",
    emojiPrices: {
  "😀": 2375,
  "😁": 4120,
  "😂": 50000,
  "🤣": 6891,
  "🙂": 1532,
  "😉": 2784,
  "😊": 3450,
  "😍": 8233,
  "😘": 7019,
  "😎": 4921,
  "😭": 3310,
  "😢": 2145,
  "😡": 4582,
  "😱": 5096,
  "🤔": 2673,
  "🙃": 1894,
  "🥲": 2981,
  "👍": 3620,
  "👎": 3478,
  "👏": 4290,
  "🙏": 3888,
  "🙌": 4512,
  "👀": 1769,
  "❤️": 1000,
  "💔": 3395,
  "🔥": 8742,
  "✨": 5233,
  "🎉": 7994,
  "💯": 8611,
  "😮": 2540
}
  }
  export default constants
