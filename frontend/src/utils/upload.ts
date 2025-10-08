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
  const type = "topic"

  const createdAt = Date.now();
  const createdBy = (await wallet.getPublicKey({ identityKey: true })).publicKey;

  const fields = [
    Utils.toArray(type, "utf8"),
    Utils.toArray(title, "utf8"),
    Utils.toArray(description, "utf8"),
    Utils.toArray("" + createdAt, "utf8"),
    Utils.toArray("" + createdBy, "utf8"),
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

export async function uploadPost({
  topicTxid,
  title,
  body,
  tags
}: {
  topicTxid: string
  title: string
  body: string
  tags: string[]
}) {
  const type = "post"

  const createdAt = Date.now();
  const createdBy = (await wallet.getPublicKey({ identityKey: true })).publicKey;

  const fields = [
    Utils.toArray(type, "utf8"),
    Utils.toArray(topicTxid, "utf8"),
    Utils.toArray(title, "utf8"),
    Utils.toArray(body, "utf8"),
    Utils.toArray(tags.join(","), "utf8"),
    Utils.toArray("" + createdAt, "utf8"),
    Utils.toArray("" + createdBy, "utf8"),
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
        outputDescription: "Uploading a post to forum",
      },
    ],
    description: "Publish a post",
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