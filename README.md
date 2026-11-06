# Tradopad
Minimal Notion-style co-founder workspace backed by Backblaze B2.

## Setup & Deploy
1. Clone repo & install: `npm install`
2. Set environment variables in `.env.local` or Vercel:
   `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET`, `B2_ENDPOINT`, `B2_REGION`, `B2_PREFIX`
3. Run development: `npm run dev`
4. Build for production: `npm run build`