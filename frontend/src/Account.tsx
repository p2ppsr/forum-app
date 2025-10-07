import { useEffect, useState } from "react";
import { AuthFetch, PushDrop, WalletClient } from "@bsv/sdk";
import { Typography } from "@mui/material";

export default function Account() {
  const wallet = new WalletClient("auto", "localhost");
  const authFetch = new AuthFetch(wallet);
  const pushdrop = new PushDrop(wallet);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    return;
  }, []);

  return <Typography>Account</Typography>;
}
