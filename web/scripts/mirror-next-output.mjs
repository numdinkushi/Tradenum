import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", ".next");
const dest = join(here, "..", "..", ".next");

if (!existsSync(src)) {
  console.error("Expected web/.next after build, but it is missing.");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("Mirrored web/.next to repo-root .next for Vercel finalization.");
