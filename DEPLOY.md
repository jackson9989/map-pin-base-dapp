# Map Pin Deployment Notes

App Name: Map Pin
Tagline: Pin a place
Description: Drop a tiny place marker with terrain, mood, wallet, and time on Base.

## Required env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0c944c1c1db8c69c491b77
NEXT_PUBLIC_BUILDER_CODE=bc_nhxpb0ox
NEXT_PUBLIC_MAP_PIN_CONTRACT_ADDRESS=0xe2f730300252a4d29f00849f945d4f49335d1244
BASE_RPC_URL=replace_with_rpc_url
```

## Order

1. Add the Vercel token, wallet address, and deployer private key to `Vercel.txt`.
2. When Base.dev gives `base:app_id`, send it here.
3. I will write Base App ID to `.env.local`, `Vercel.txt`, and this file, then link/deploy with the token from `Vercel.txt`.
4. I will move the private key into `.env.local`, run `npm run deploy:contract`, and write the contract address back to `.env.local` and `Vercel.txt`.
5. When Base.dev gives Builder Code, send it here.
6. I will write Builder Code to `.env.local` and `Vercel.txt`, add required Vercel env vars, and redeploy production.

## Current deployment

Deployed URL: `https://map-pin-eight.vercel.app`

Contract Address: `0xe2f730300252a4d29f00849f945d4f49335d1244`

Contract Transaction: `https://basescan.org/tx/0x8c8863c9a4e917cf042904c4411e1cf7ae414aded89e0f55f43e919451dccc48`

Builder Code: `bc_nhxpb0ox`

## Files to sync after Base App ID or Builder Code changes

- `/Users/koala/map-pin/.env.local`
- `/Users/koala/map-pin/Vercel.txt`
- `/Users/koala/map-pin/DEPLOY.md`
- `/Users/koala/map-pin/src/app/layout.tsx`
- `/Users/koala/map-pin/src/lib/wagmi.ts`
- `/Users/koala/map-pin/src/lib/map-pin.ts`
