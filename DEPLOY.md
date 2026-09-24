# Put Rehearse online for free (Cloudflare Workers)

This keeps the app at £0. Cloudflare's free Workers plan needs no card, and when a free
limit is reached requests are refused rather than charged.

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

It prints your address, like `https://rehearse.<your-name>.workers.dev`. Run the same command
again after any change.

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
