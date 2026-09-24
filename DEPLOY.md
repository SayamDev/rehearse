# Put Rehearse online for free (Cloudflare Workers)

This keeps the app at £0. Cloudflare's free Workers plan needs no card, and when a free
limit is reached requests are refused rather than charged.

## You keep ownership

Checked on 24 September 2026 in each host's own terms:

- **Cloudflare** (Self-Serve Subscription Agreement, section 2.5.1): you "retain all right,
  title and interest" in everything you upload. Cloudflare only gets a licence to store and
  serve it so the service works. It also receives only the built app, not your source code.
- **Vercel** (Terms, section 3): the terms don't say you keep ownership in the same way, and on
  the free Hobby plan Vercel may use your content to train AI and share it with third parties.
  **Don't use Vercel Hobby for this app.**

The app itself also says who owns it: LICENSE (all rights reserved), the footer on every page,
and the package details. Re-read a host's terms before using any other provider.

## Rules that keep it free

- **Never add a payment method** to Cloudflare or Groq. Without one, nothing can bill.
- Stay on the **Workers Free** plan. Don't enable R2, KV, D1, Images or Workers Paid.
- Don't set `ALLOW_PAID_AI` or an Anthropic key in production.
- Don't set `OLLAMA_URL` in production: Ollama runs on your own computer, which the hosted
  site can't reach. Online, Groq's free tier does the AI and Kokoro speaks in each visitor's browser.

## One-time setup

1. Create a free account at https://dash.cloudflare.com/sign-up (no card needed).
2. In this folder, sign in (opens your browser):

   ```bash
   npx wrangler login
   ```

3. Add your Groq key as a secret (you'll paste it into the terminal, not into any file or chat):

   ```bash
   npx wrangler secret put GROQ_API_KEY
   ```

## Deploy

```bash
npm run cf:deploy
```

It prints your address (this app: https://rehearse.sayamdev.workers.dev). Run the same
command again after any change. It sets `.env.local` aside while building, because the
Cloudflare adapter would otherwise copy those local settings (your key and the Ollama setting)
into the uploaded worker.

## Try it on your computer first (optional)

```bash
npm run cf:preview
```

## Free limits (checked for this app)

- Workers Free: 100,000 requests a day and a 3 MB worker. Rehearse's worker is about 2.1 MB.
- Most pages are pre-built, so they're served as static files and don't count toward CPU time.
- Groq free tier: about 1,000 text AI calls and 100 speech clips a day, shared by everyone.
  The app keeps a little under this and switches to built-in notes when it's used up.
  Each copy of the worker counts separately, so Groq itself may say "limit reached" first;
  that's still free, and the built-in notes take over.
