import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;

export const walletMonitorTool = createTool({
  id: "wallet-monitor",
  description: "Summarize recent token transfers and swaps for a Solana wallet",
  inputSchema: z.object({
    wallet: z.string(),
    timeframeHours: z.number().default(24),
  }),
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { wallet, timeframeHours } = context;
    const since = Date.now() - timeframeHours * 3600 * 1000;

    const response = await axios.get(
      `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&limit=100`
    );

    const transactions = response.data.filter(
      (tx: any) => tx.timestamp && tx.timestamp * 1000 >= since
    );

    const actions: string[] = [];

    for (const tx of transactions) {
      const transfers = tx.tokenTransfers || [];
      const signature = tx.signature;
      const time = new Date(tx.timestamp * 1000).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      for (const t of transfers) {
        const token = t.tokenName || "Unknown Token";
        const mint = t.mint || "Unknown";
        const from = t.fromUserAccount || "Unknown";
        const to = t.toUserAccount || "Unknown";
        const amount = t.tokenAmount || "N/A";

        const direction =
          wallet === from
            ? `Sent ${amount} ${token} ➡️ ${to}`
            : `Received ${amount} ${token} ⬅️ ${from}`;

        actions.push(
          `🔄 **Transfer**
• ${direction}
• Mint: \`${mint}\`
• 🕐 ${time}
• 🔗 [View Tx](https://solscan.io/tx/${signature})`
        );
      }

      // Optional: handle swaps separately if needed
      const hasSwap = tx.instructions?.some((i: any) =>
        ["jup.ag", "raydium.io", "orca.so"].some((dapp) =>
          (i.programName || "").toLowerCase().includes(dapp)
        )
      );

      if (hasSwap && transfers.length >= 2) {
        const [fromT, toT] = transfers;
        actions.push(
          `🔁 **Swap**
• ${fromT.tokenAmount} ${fromT.tokenName} → ${toT.tokenAmount} ${toT.tokenName}
• Program: Jupiter / Raydium / Orca
• 🕐 ${time}
• 🔗 [View Tx](https://solscan.io/tx/${signature})`
        );
      }
    }

    const summary = actions.length
      ? `## 📊 Wallet \`${wallet}\` activity summary (last ${timeframeHours}h)\n\n${actions
          .slice(0, 10)
          .join("\n\n")}${actions.length > 10 ? `\n\n...and ${actions.length - 10} more.` : ""}`
      : `Wallet \`${wallet}\` has not performed any token transfers in the last ${timeframeHours} hour(s).`;

    return { summary };
  },
});
