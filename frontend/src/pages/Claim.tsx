import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  LookupResolver,
  P2PKH,
  PublicKey,
  PushDrop,
  Transaction,
  Utils,
  ProtoWallet,
  WalletClient,
  type AtomicBEEF,
} from '@bsv/sdk';
import constants from '../constants';

type Claimable = {
  tx: any,
  beef: number[],
  txid: string;
  outputIndex: number;
  satoshis: number;
  emoji: string;
  fromPubKey: string; // reactor identity
};

export default function ClaimPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Claimable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const wallet = useMemo(() => new WalletClient('auto', 'localhost'), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userPubKey = (await wallet.getPublicKey({ identityKey: true }))
        .publicKey;
      const userLockingScriptHex = new P2PKH()
        .lock(PublicKey.fromString(userPubKey).toAddress())
        .toHex();
      // Query backend lookup for all reactions
      const resolver = new LookupResolver({
        networkPreset:
          window.location.hostname === 'localhost' ? 'local' : 'mainnet',
      });
      const question = {
        service: constants.lookupService,
        query: { query: 'getAllReactions' },
      } as any;
      const lookupResult = await resolver.query(question);
      if (lookupResult.type !== 'output-list') {
        throw new Error('Unexpected response from lookup service');
      }
      console.log("lookupResult", lookupResult)
      const next: Claimable[] = [];

      for (const out of lookupResult.outputs) {
        try {
          const tx = await Transaction.fromBEEF(out.beef);

          // Find the reaction PushDrop output to extract emoji and reactor pubkey
          let emoji = '';
          let fromPubKey = '';
          tx.outputs[0].lockingScript
          const decoded = await PushDrop.decode(tx.outputs[0].lockingScript as any);
          const f = decoded.fields;
          const type = Utils.toUTF8(Utils.toArray(f[0]));
          if (type === 'reaction') {
            emoji = Utils.toUTF8(Utils.toArray(f[4]));
            fromPubKey = Utils.toUTF8(Utils.toArray(f[5]));
          }

          // for (const o of tx.outputs) {
          //   try {
          //     const decoded = await PushDrop.decode(o.lockingScript as any);
          //     const f = decoded.fields;
          //     const type = Utils.toUTF8(Utils.toArray(f[0]));
          //     if (type === 'reaction') {
          //       emoji = Utils.toUTF8(Utils.toArray(f[4]));
          //       fromPubKey = Utils.toUTF8(Utils.toArray(f[5]));
          //       break;
          //     }
          //   } catch {
          //     /* not a pushdrop */
          //   }
          // }

          // Find a payout to the current user
          // tx.outputs.forEach((o, idx) => {
          //   console.log("o", o)
          //   try {
          //     const scriptHex = o.lockingScript.toHex();

                next.push({
                  tx: tx,
                  beef: out.beef,
                  txid: tx.id('hex'),
                  outputIndex: 1,
                  satoshis: tx.outputs[1].satoshis,
                  emoji,
                  fromPubKey,
                });
          //   } catch {
          //     /* ignore */
          //   }
          // });
        } catch {
          /* ignore tx parse errors */
        }
      }

      setItems(next);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    void load();
  }, [load]);

  const claimOne = useCallback(
    async (c: Claimable) => {
      setClaiming(`${c.txid}:${c.outputIndex}`);
      try {
        const resolver = new LookupResolver({
          networkPreset:
            window.location.hostname === 'localhost' ? 'local' : 'mainnet',
        });
        const question = {
          service: constants.lookupService,
          query: { query: 'getReactionByTxid', parameter: {txid: c.txid, outputIndex: 0} },
        } as any;
        const lookupResult = await resolver.query(question);
        if (lookupResult.type !== 'output-list')
          throw new Error('Unexpected lookup response');

        const result = Transaction.fromBEEF(lookupResult.outputs[0].beef)
        if (!result) throw new Error('Transaction not found in lookup index');
        const fields = PushDrop.decode(result.outputs[0].lockingScript)
        console.log(fields)
        let derivationPrefix = Utils.toUTF8(fields.fields[7])
        let derivationSuffix = Utils.toUTF8(fields.fields[8])
        console.log("result",result )
        console.log("c.txid",c.txid)
        console.log("c",c)
        console.log("derivationPrefix",derivationPrefix)
        console.log("derivationSuffix",derivationSuffix)
        console.log("c.fromPubKey",c.fromPubKey)

        let anyoneWallet = new ProtoWallet("anyone")
        const { publicKey: derivedPublicKey } = await anyoneWallet.getPublicKey({
          identityKey: true,
        })
        console.log("derivedPublicKey", derivedPublicKey)
        // Internalize the specific output into the wallet
        await wallet.internalizeAction({
          tx: c.tx.toAtomicBEEF(),
          outputs: [
            {
              paymentRemittance: {
                derivationPrefix: derivationPrefix,
                derivationSuffix: derivationSuffix,
                senderIdentityKey: derivedPublicKey,
              },
              outputIndex: c.outputIndex,
              protocol: 'wallet payment',
            },
          ],
          labels: ['reaction-payout'],
          description: `Claim reaction payout ${c.emoji}`,
        });

        // setItems((prev) =>
        //   prev.filter(
        //     (x) => !(x.txid === c.txid && x.outputIndex === c.outputIndex)
        //   )
        // );
      } catch (e) {
        console.error(e);
      } finally {
        setClaiming(null);
      }
    },
    [wallet]
  );

  const claimAll = useCallback(async () => {
    setClaiming('ALL');
    try {
      const resolver = new LookupResolver({
        networkPreset:
          window.location.hostname === 'localhost' ? 'local' : 'mainnet',
      });
      const question = {
        service: constants.lookupService,
        query: { query: 'getAllReactions' },
      } as any;
      const lookupResult = await resolver.query(question);
      if (lookupResult.type !== 'output-list')
        throw new Error('Unexpected lookup response');

      // Group claimables by txid to minimize internalizeAction calls
      const byTx = new Map<string, { beef: number[]; outputs: number[] }>();
      for (const c of items) {
        const entry = byTx.get(c.txid);
        if (!entry) {
          const rec = lookupResult.outputs.find((o: any) => {
            try {
              return Transaction.fromBEEF(o.beef).id('hex') === c.txid;
            } catch {
              return false;
            }
          });
          if (!rec) continue;
          byTx.set(c.txid, { beef: rec.beef, outputs: [c.outputIndex] });
        } else {
          entry.outputs.push(c.outputIndex);
        }
      }

      for (const [, { beef, outputs }] of byTx.entries()) {
        await wallet.internalizeAction({
          tx: beef,
          outputs: outputs.map((i) => ({
            outputIndex: i,
            protocol: 'wallet payment',
          })),
          labels: ['reaction-payout'],
          description: `Claim ${outputs.length} payout(s)`,
        });
      }

      setItems([]);
    } finally {
      setClaiming(null);
    }
  }, [items, wallet]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Claim Payouts</Typography>
        <Button
          variant="contained"
          disabled={loading || claiming !== null || items.length === 0}
          onClick={() => {
            void claimAll();
          }}
        >
          {claiming === 'ALL' ? 'Claiming...' : `Claim All (${items.length})`}
        </Button>
      </Stack>

      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Stack spacing={2}>
        {items.map((c) => (
          <Card key={`${c.txid}:${c.outputIndex}`} variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">Reaction: {c.emoji}</Typography>
              <Typography variant="body2" color="text.secondary">
                From: {c.fromPubKey.slice(0, 16)}…
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: {c.satoshis} sats
              </Typography>
              <Typography variant="caption" color="text.secondary">
                UTXO: {c.txid.slice(0, 16)}…:{c.outputIndex}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                disabled={claiming !== null}
                onClick={() => {
                  void claimOne(c);
                }}
              >
                {claiming === `${c.txid}:${c.outputIndex}`
                  ? 'Claiming...'
                  : 'Claim'}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      {!loading && items.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No payouts available.
        </Typography>
      )}
    </Box>
  );
}
