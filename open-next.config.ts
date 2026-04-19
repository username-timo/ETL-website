// Cloudflare Workers adapter config for OpenNext.
// Docs: https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Default incremental cache uses an in-memory / KV-backed store.
  // For now we ship without ISR/on-demand revalidation; can add KV/R2 later if needed.
});
