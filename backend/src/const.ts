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
    topicManager: "tm_block",
    lookupService: "ls_block",
    emojiPrices: {
      "😀": 75,
      "😁": 80,
      "😂": 120,
      "🤣": 140,
      "🙂": 60,
      "😉": 65,
      "😊": 85,
      "😍": 150,
      "😘": 130,
      "😎": 110,
      "😭": 90,
      "😢": 70,
      "😡": 95,
      "😱": 100,
      "🤔": 70,
      "🙃": 55,
      "🥲": 65,
      "👍": 80,
      "👎": 80,
      "👏": 90,
      "🙏": 85,
      "🙌": 95,
      "👀": 60,
      "❤️": 200,
      "💔": 90,
      "🔥": 180,
      "✨": 100,
      "🎉": 150,
      "💯": 170,
      "😮": 75
    }
  }
  export default constants
