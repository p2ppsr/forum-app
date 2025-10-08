import type { SecurityLevel } from "@bsv/sdk" 
  interface Constants {
    protocolId: string,
    securityProtocol: SecurityLevel
    topicManager: string,
    lookupService: string
  }
  let constants: Constants = { 
    protocolId: "test_forum_1" ,
    securityProtocol: 1,
    topicManager: "tm_test_forum_1",
    lookupService: "ls_test_forum_1"
  }
  export default constants
