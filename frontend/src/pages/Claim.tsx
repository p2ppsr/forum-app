import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import {
  LookupResolver,
  PushDrop,
  Transaction,
  Utils,
  ProtoWallet,
  WalletClient,
} from '@bsv/sdk';
import constants from '../constants';

type Claimable = {
  tx: any;
  beef: number[];
  txid: string;
  outputIndex: number;
  satoshis: number;
  emoji: string;
  fromPubKey: string;
};

export default function ClaimPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Claimable[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const wallet = useMemo(() => new WalletClient('auto', 'localhost'), []);

  const lookupResolver = new LookupResolver({
    networkPreset:
      window.location.hostname === 'localhost' ? 'local' : 'mainnet',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userPubKey = (await wallet.getPublicKey({ identityKey: true }))
        .publicKey;
      // Query backend lookup for all reactions

      const question = {
        service: constants.lookupService,
        query: {
          query: 'getpaymentsfor',
          parameter: { publicKey: userPubKey },
        },
      } as any;
      const lookupResult = await lookupResolver.query(question);
      if (lookupResult.type !== 'output-list') {
        throw new Error('Unexpected response from lookup service');
      }
      const next: Claimable[] = [];

      for (const out of lookupResult.outputs) {
        try {
          const tx = await Transaction.fromBEEF(out.beef);

          // Find the reaction PushDrop output to extract emoji and reactor pubkey
          let emoji = '';
          let fromPubKey = '';
          tx.outputs[0].lockingScript;
          const decoded = await PushDrop.decode(
            tx.outputs[0].lockingScript as any
          );
          const f = decoded.fields;
          const type = Utils.toUTF8(Utils.toArray(f[0]));
          if (type === 'reaction') {
            emoji = Utils.toUTF8(Utils.toArray(f[4]));
            fromPubKey = Utils.toUTF8(Utils.toArray(f[5]));
          }
          if (tx.outputs[1].satoshis) {
            next.push({
              tx: tx,
              beef: out.beef,
              txid: tx.id('hex'),
              outputIndex: 1,
              satoshis: tx.outputs[1].satoshis,
              emoji,
              fromPubKey,
            });
          }
        } catch {}
      }

      const baskettedPayments = await wallet.listOutputs({
        basket: 'claimedReactionPayment',
      });

      const baskettedArr = Array.isArray(baskettedPayments)
        ? baskettedPayments
        : baskettedPayments?.outputs ?? [];

      const claimedTxids = new Set(
        baskettedArr
          .map((o: any) => {
            const op = o?.outpoint ?? o?.outPoint ?? o?.out_point;
            if (typeof op === 'string') {
              return op.split(/[.:]/)[0];
            }
            if (o?.txid || o?.txId) return o.txid ?? o.txId;
            return null;
          })
          .filter((v: any): v is string => Boolean(v))
      );
      const filteredNext = next.filter(
        (claimable) => !claimedTxids.has(claimable.txid)
      );

      setItems(filteredNext);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    void load();
  }, [load]);
 
  const claimAll = useCallback(
    async () => {
      if (items.length === 0) return;
      setClaiming('ALL');
      setError(null);
      try {
        const anyoneWallet = new ProtoWallet('anyone');
        const { publicKey: derivedPublicKey } = await anyoneWallet.getPublicKey(
          {
            identityKey: true,
          }
        );

        await Promise.all(
          items.map(async (claimable) => {
            try {
              const question = {
                service: constants.lookupService,
                query: {
                  query: 'getReactionByTxid',
                  parameter: { txid: claimable.txid, outputIndex: 0 },
                },
              } as any;
              const lookupResult = await lookupResolver.query(question);
              if (lookupResult.type !== 'output-list')
                throw new Error('Unexpected lookup response');

              const result = Transaction.fromBEEF(lookupResult.outputs[0].beef);
              if (!result)
                throw new Error('Transaction not found in lookup index');
              const fields = PushDrop.decode(result.outputs[0].lockingScript);
              const derivationPrefix = Utils.toUTF8(fields.fields[7]);
              const derivationSuffix = Utils.toUTF8(fields.fields[8]);

              // Internalize the specific output into the wallet
              await wallet.internalizeAction({
                tx: claimable.tx.toAtomicBEEF(),
                outputs: [
                  {
                    insertionRemittance: {
                      basket: 'claimedReactionPayment',
                    },
                    outputIndex: 0,
                    protocol: 'basket insertion',
                  },
                  {
                    paymentRemittance: {
                      derivationPrefix: derivationPrefix,
                      derivationSuffix: derivationSuffix,
                      senderIdentityKey: derivedPublicKey,
                    },
                    outputIndex: claimable.outputIndex,
                    protocol: 'wallet payment',
                  },
                ],
                labels: ['reaction-payout'],
                description: `Claim reaction payout ${claimable.emoji}`,
              });
            } catch (error) {
              console.error(error);
            }
          })
        );

        await load();
      } catch (e: any) {
        console.error(e);
        setError(e?.message || String(e));
      } finally {
        setClaiming(null);
      }
    },
    [items, load, lookupResolver, wallet]
  );

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
        {items.map((claimable) => (
          <Card
            key={`${claimable.txid}:${claimable.outputIndex}`}
            variant="outlined"
          >
            <CardContent>
              <Typography variant="subtitle1">
                Reaction: {claimable.emoji}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From: {claimable.fromPubKey.slice(0, 16)}…
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: {claimable.satoshis} sats
              </Typography>
              <Typography variant="caption" color="text.secondary">
                UTXO: {claimable.txid.slice(0, 16)}…:{claimable.outputIndex}
              </Typography>
            </CardContent>
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
