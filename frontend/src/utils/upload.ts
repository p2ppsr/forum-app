import {
  Utils,
  WalletClient,
  PushDrop,
  TopicBroadcaster,
  Transaction,
  PublicKey,
  P2PKH,
} from '@bsv/sdk';
import BabbageGo from '@babbage/go';
import constants from '../constants';

function randomBase64(length: number): string {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

const wallet = new BabbageGo(new WalletClient('auto', 'localhost'), {
  monetization: {
    developerFeeSats: 10,
    developerIdentity:
      '025a2cb22976ff42743e4b168f853021b1042aa392792743d60b1234e9d5de5efe',
  },
  walletUnavailable: {
    title: 'REEEEEEEEE JACKIE TODO',
  },
});

const pushdrop = new PushDrop(wallet);

export async function uploadTopic({
  title,
  description,
  setStatusText,
}: {
  title: string;
  description: string;
  setStatusText: (text: string) => void;
}) {
  const type = 'topic';

  const createdAt = Date.now();
  const createdBy = (await wallet.getPublicKey({ identityKey: true }))
    .publicKey;

  const fields = [
    Utils.toArray(type, 'utf8'),
    Utils.toArray(title, 'utf8'),
    Utils.toArray(description, 'utf8'),
    Utils.toArray('' + createdAt, 'utf8'),
    Utils.toArray('' + createdBy, 'utf8'),
  ];

  const lockingScript = await pushdrop.lock(
    fields,
    [constants.securityProtocol, constants.protocolId],
    '1',
    'anyone',
    true
  );

  setStatusText?.('Publishing topic...');
  const { tx } = await wallet.createAction({
    outputs: [
      {
        lockingScript: lockingScript.toHex(),
        satoshis: 1,
        outputDescription: 'Uploading a topic to forum',
      },
    ],
    description: 'Publish a topic',
    options: {
      acceptDelayedBroadcast: false,
      randomizeOutputs: false,
    },
  });

  if (!tx) {
    throw new Error('Error creating action');
  }
  const broadcaster = new TopicBroadcaster([constants.topicManager], {
    networkPreset:
      window.location.hostname === 'localhost' ? 'local' : 'mainnet',
  });
  await broadcaster.broadcast(Transaction.fromAtomicBEEF(tx));
  setStatusText?.('Topic broadcasted.');

  return;
}

export async function uploadPost({
  topicTxid,
  title,
  body,
  tags,
}: {
  topicTxid: string;
  title: string;
  body: string;
  tags: string[];
}) {
  const type = 'post';

  const createdAt = Date.now();
  const createdBy = (await wallet.getPublicKey({ identityKey: true }))
    .publicKey;

  const fields = [
    Utils.toArray(type, 'utf8'),
    Utils.toArray(topicTxid, 'utf8'),
    Utils.toArray(title, 'utf8'),
    Utils.toArray(body, 'utf8'),
    Utils.toArray('' + createdAt, 'utf8'),
    Utils.toArray('' + createdBy, 'utf8'),
    Utils.toArray(tags.join(','), 'utf8'),
    [],
  ];

  const lockingScript = await pushdrop.lock(
    fields,
    [constants.securityProtocol, constants.protocolId],
    '1',
    'anyone',
    true
  );

  const { tx } = await wallet.createAction({
    outputs: [
      {
        lockingScript: lockingScript.toHex(),
        satoshis: 1,
        outputDescription: 'Uploading a post to forum',
      },
    ],
    description: 'Publish a post',
    options: {
      acceptDelayedBroadcast: false,
      randomizeOutputs: false,
    },
  });

  if (!tx) {
    throw new Error('Error creating action');
  }
  const broadcaster = new TopicBroadcaster([constants.topicManager], {
    networkPreset:
      window.location.hostname === 'localhost' ? 'local' : 'mainnet',
  });
  await broadcaster.broadcast(Transaction.fromAtomicBEEF(tx));

  return;
}

export async function uploadReply({
  postTxid,
  parentReplyId,
  body,
}: {
  postTxid: string;
  parentReplyId: string;
  body: string;
}) {
  const type = 'reply';

  const createdAt = Date.now();
  const createdBy = (await wallet.getPublicKey({ identityKey: true }))
    .publicKey;

  const fields = [
    Utils.toArray(type, 'utf8'),
    Utils.toArray(postTxid, 'utf8'),
    Utils.toArray(parentReplyId, 'utf8'),
    Utils.toArray(body, 'utf8'),
    Utils.toArray('' + createdAt, 'utf8'),
    Utils.toArray('' + createdBy, 'utf8'),
    [],
  ];

  const lockingScript = await pushdrop.lock(
    fields,
    [constants.securityProtocol, constants.protocolId],
    '1',
    'anyone',
    true
  );

  const { tx } = await wallet.createAction({
    outputs: [
      {
        lockingScript: lockingScript.toHex(),
        satoshis: 1,
        outputDescription: 'Uploading a reply to forum',
      },
    ],
    description: 'Publish a reply',
    options: {
      acceptDelayedBroadcast: false,
      randomizeOutputs: false,
    },
  });

  console.log(`type: ${type}`);
  console.log(`postTxid: ${postTxid}`);
  console.log(`parentReplyId: ${parentReplyId}`);
  console.log(`body: ${body}`);
  console.log(`createdAt: ${createdAt}`);
  console.log(`createdBy: ${createdBy}`);

  if (!tx) {
    throw new Error('Error creating action');
  }
  const broadcaster = new TopicBroadcaster([constants.topicManager], {
    networkPreset:
      window.location.hostname === 'localhost' ? 'local' : 'mainnet',
  });
  await broadcaster.broadcast(Transaction.fromAtomicBEEF(tx));

  return;
}

export async function uploadReaction({
  topic_txid,
  parentPostTxid,
  directParentTxid,
  reaction,
  feeRecipientPublicKey,
  feeSatoshis,
  recipientPublicKey,
  recipientSatoshis,
}: {
  topic_txid: string;
  parentPostTxid: string;
  directParentTxid: string;
  reaction: string;
  feeRecipientPublicKey: string;
  feeSatoshis: number;
  recipientPublicKey: string;
  recipientSatoshis?: number;
}) {
  const type = 'reaction';

  const createdBy = (await wallet.getPublicKey({ identityKey: true }))
    .publicKey;
  if (!(recipientPublicKey && recipientPublicKey.trim())) {
    throw new Error('recipientPublicKey required for reaction payout');
  }

  const derivationPrefix = randomBase64(10);
  const derivationSuffix = randomBase64(10);

  const fields = [
    Utils.toArray(type, 'utf8'),
    Utils.toArray(topic_txid, 'utf8'),
    Utils.toArray(parentPostTxid, 'utf8'),
    Utils.toArray(directParentTxid, 'utf8'),
    Utils.toArray(reaction, 'utf8'),
    Utils.toArray('' + createdBy, 'utf8'),
    Utils.toArray('' + recipientPublicKey, 'utf8'),
    Utils.toArray(derivationPrefix, 'utf8'),
    Utils.toArray(derivationSuffix, 'utf8'),
  ];

  const reactionLockingScript = await pushdrop.lock(
    fields,
    [constants.securityProtocol, constants.protocolId],
    '1',
    'anyone',
    true
  );

  const outputs: {
    lockingScript: string;
    satoshis: number;
    outputDescription: string;
  }[] = [];

  // Put the reaction output first for consistency
  outputs.push({
    lockingScript: reactionLockingScript.toHex(),
    satoshis: 1,
    outputDescription: 'Uploading a reaction to forum',
  });

  // Optional server fee output if configured (non-empty and >0)
  if (
    (feeRecipientPublicKey || '').trim() &&
    typeof feeSatoshis === 'number' &&
    feeSatoshis > 0
  ) {

    const { publicKey: derivedPublicKey } = await wallet.getPublicKey({
      protocolID: [2, '3241645161d8'],
      keyID: `${derivationPrefix} ${derivationSuffix}`,
      counterparty: feeRecipientPublicKey
    })


    const feeLockingScript = new P2PKH()
      .lock(PublicKey.fromString(derivedPublicKey).toAddress())
      .toHex();
    outputs.push({
      lockingScript: feeLockingScript,
      satoshis: feeSatoshis,
      outputDescription: 'Reaction fee',
    });
  }

  // Enforced recipient payout based on emoji price
  const emojiPrice = (constants.emojiPrices as any)[reaction] ?? 0;
  const payoutSats =
    typeof recipientSatoshis === 'number' && recipientSatoshis > 0
      ? recipientSatoshis
      : emojiPrice;
  if (recipientPublicKey && payoutSats > 0) {
    const recipientScript = new P2PKH()
      .lock(PublicKey.fromString(recipientPublicKey).toAddress())
      .toHex();
    outputs.push({
      lockingScript: recipientScript,
      satoshis: payoutSats,
      outputDescription: 'Reaction recipient payout',
    });
  }

  console.log(outputs);

  const { tx } = await wallet.createAction({
    outputs,
    description: 'Publish a reaction (with fee)',
    options: {
      acceptDelayedBroadcast: false,
      randomizeOutputs: false,
    },
  });

  if (!tx) {
    throw new Error('Error creating action');
  }
  const broadcaster = new TopicBroadcaster([constants.topicManager], {
    networkPreset:
      window.location.hostname === 'localhost' ? 'local' : 'mainnet',
  });
  await broadcaster.broadcast(Transaction.fromAtomicBEEF(tx));

  return;
}
