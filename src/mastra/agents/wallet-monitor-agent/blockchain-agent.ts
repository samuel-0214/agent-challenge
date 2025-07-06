import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import { walletMonitorTool } from "./wallet-monitor-tool";

export const blockchainAgent = new Agent({
  name: "Blockchain Monitor",
  instructions: `
    You are a blockchain analyst agent.
    Given a wallet address and timeframe, analyze its recent on-chain activity.
    Use the walletMonitorTool to retrieve data and summarize the activity concisely.
  `,
  model,
  tools: { walletMonitorTool },
});
