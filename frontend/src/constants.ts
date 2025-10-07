import type { SecurityLevel } from "@bsv/sdk" 

interface Constants {
    protocolId: string,
    securityProtocol: SecurityLevel
    topicManager: string,
    lookupService: string
  }
  
  let constants: Constants
  
  constants = { 
    protocolId: "testforum1" ,
    securityProtocol: 1,
    topicManager: "tm_testforum1",
    lookupService: "ls_testforum1"
  }
  
  
  export default constants
  