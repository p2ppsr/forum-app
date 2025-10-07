import { Utils, WalletClient, PushDrop, GlobalKVStore, TopicBroadcaster, Transaction } from "@bsv/sdk";
import constants from "../constants";

const wallet = new WalletClient("auto", "localhost");
const pushdrop = new PushDrop(wallet);

export async function uploadTopic({
  title,
  description,
  setStatusText
}: {
  title: string;
  description: string;
  setStatusText: (text: string) => void
}) {
  const created_at = Date.now();
  const created_by = wallet.getPublicKey({ identityKey: true });

  const fields = [
    Utils.toArray(title, "utf8"),
    Utils.toArray(description, "utf8"),
    Utils.toArray("" + created_at, "utf8"),
    Utils.toArray(created_by, "utf8"),
  ];

  const lockingScript = await pushdrop.lock(
    fields,
    [constants.securityProtocol, constants.protocolId],
    "1",
    "anyone",
    true
  );

  const { txid, tx } = await wallet.createAction({
    outputs: [
      {
        lockingScript: lockingScript.toHex(),
        satoshis: 1,
        outputDescription: "Uploading a topic to forum",
      },
    ],
    description: "Publish a topic",
    options: {
      acceptDelayedBroadcast: false,
      randomizeOutputs: false,
    },
  });

  if (!tx) {
    throw new Error("Error creating action")
  }
  const broadcaster = new TopicBroadcaster([constants.topicManager], { 
    networkPreset: window.location.hostname === 'localhost' ? 'local' : 'mainnet'
  })
  const backendResponse = await broadcaster.broadcast(Transaction.fromAtomicBEEF(tx))

  return
}
