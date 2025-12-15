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
    topicManager: "tm_blockbeta",
    lookupService: "ls_blockbeta",
    emojiPrices: {
  "😀": 2500,
  "😁": 4000,
  "😂": 50000,
  "🤣": 6900,
  "🙂": 1500,
  "😉": 2800,
  "😊": 3500,
  "😍": 8200,
  "😘": 7000,
  "😎": 4900,
  "😭": 3300,
  "😢": 2100,
  "😡": 4600,
  "😱": 5100,
  "🤔": 2700,
  "🙃": 1900,
  "🥲": 3000,
  "👍": 3600,
  "👎": 3500,
  "👏": 4300,
  "🙏": 3900,
  "🙌": 4500,
  "👀": 1800,
  "❤️": 1000,
  "💔": 3400,
  "🔥": 8700,
  "✨": 5200,
  "🎉": 8000,
  "💯": 8600,
  "😮": 2500
}
  }
  export default constants
