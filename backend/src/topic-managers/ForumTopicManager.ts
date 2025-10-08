import { AdmittanceInstructions, TopicManager } from "@bsv/overlay";
import docs from "./ForumTopicDocs.md.js";
import { PublicKey, PushDrop, Transaction, Utils } from "@bsv/sdk";

/**
 * Forum for a Topic Manager that can be modified for your specific use-case.
 */
export default class ForumTopicManager implements TopicManager {
  /**
   * Identify which outputs in the supplied transaction are admissible.
   *
   * @param beef          Raw transaction encoded in BEEF format.
   * @param previousCoins Previously‑retained coins.
   */
  async identifyAdmissibleOutputs(
    beef: number[],
    previousCoins: number[]
  ): Promise<AdmittanceInstructions> {
    const admissibleOutputs: number[] = [];

    try {
      const decodedTx = Transaction.fromBEEF(beef);
      const outputs = decodedTx.outputs;

      for (const [index, output] of outputs.entries()) {
        try {
          const decodedScript = PushDrop.decode(output.lockingScript);
          const fields = decodedScript.fields;

          // Check if the output is a topic
          if (Utils.toUTF8(Utils.toArray(fields[0])) === "topic") {
            (await this.checkTopic(fields))
              ? admissibleOutputs.push(index)
              : console.log("Invalid topic")
            continue
          }
        } catch (error) {
          continue
        }
      }
    } catch (error) {
      console.error("Error identifying admissible outputs", error);
    }

    return {
      outputsToAdmit: admissibleOutputs,
      coinsToRetain: [],
    }
  }

  /**
   * Get the documentation associated with this topic manager
   * @returns A promise that resolves to a string containing the documentation
   */
  async getDocumentation(): Promise<string> {
    return docs
  }

  /**
   * Get metadata about the topic manager
   * @returns A promise that resolves to an object containing metadata
   */
  async getMetaData(): Promise<{
    name: string;
    shortDescription: string;
    iconURL?: string;
    version?: string;
    informationURL?: string;
  }> {
    return {
      name: "Forum Topic Manager",
      shortDescription: "Admit outputs into a topic",
    }
  }

  async checkTopic(fields: number[][]) {
    try {

      if (fields.length !== 6) {
        console.log("Invalid topic fields length");
        return false
      }

      if (fields[1].length === 0) {
        console.log("Invalid topic name");
        return false
      }

      if (fields[2].length === 0) {
        console.log("Invalid topic description");
        return false
      }

      const createdAt = parseInt(Utils.toUTF8(Utils.toArray(fields[3])), 10)
      const now = Date.now();
      const thirtyMin = 30 * 60 * 1000;

      if (Number.isNaN(createdAt) || createdAt > now || createdAt < now - thirtyMin) {
        console.log("Invalid topic created_at");
        return false
      }
      
      try {
        PublicKey.fromString(Utils.toUTF8(Utils.toArray(fields[4])))
      } catch {
        console.log('Invalid public key format.')
        return false
      }
    } catch (error) {
      console.error("Error checking topic", error);
      return false
    }
    
    return true
  }
}
