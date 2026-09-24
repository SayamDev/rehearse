// Cloudflare adapter settings. The app has no incremental static regeneration, so no
// cache storage (R2) is needed; static pages are served straight from Workers assets.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
