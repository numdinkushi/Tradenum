export const SHELL_TABS = [
  { id: "play", label: "Play", kicker: "01", blurb: "One name. Six nodes." },
  { id: "ledger", label: "Ledger", kicker: "02", blurb: "Numbered tickets. Vetoes kept." },
  { id: "universe", label: "Universe", kicker: "03", blurb: "Scan the six names." },
  { id: "watch", label: "Watch", kicker: "04", blurb: "Open paper risk." },
  { id: "mcp", label: "MCP", kicker: "05", blurb: "Same agent. Five tools." },
] as const;

export type ShellTab = (typeof SHELL_TABS)[number]["id"];
