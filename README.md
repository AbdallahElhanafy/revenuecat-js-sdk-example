# RevenueCat Web Billing example

A [Next.js](https://nextjs.org) reference app showing how to render a [RevenueCat Web Billing](https://www.revenuecat.com/docs/web/web-billing) paywall — via [`@revenuecat/purchases-js`](https://github.com/RevenueCat/purchases-js) — fullscreen, including handling for mobile Safari's inset, keyboard, and viewport-height quirks. See [`src/components/FullscreenPaywallStage.tsx`](src/components/FullscreenPaywallStage.tsx) for the implementation.

## Getting Started

Copy `.env.example` to `.env.local` and fill in your RevenueCat Web Billing public API key:

```bash
cp .env.example .env.local
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click through to `/paywall` to see the fullscreen paywall.

## Learn More

- [RevenueCat Web Billing docs](https://www.revenuecat.com/docs/web/web-billing)
- [purchases-js SDK](https://github.com/RevenueCat/purchases-js)
- [Next.js Documentation](https://nextjs.org/docs)
