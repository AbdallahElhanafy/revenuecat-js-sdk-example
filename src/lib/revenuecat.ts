import { LogLevel, Purchases } from "@revenuecat/purchases-js";

const ANON_USER_ID_STORAGE_KEY = "rc-anonymous-app-user-id";

function getOrCreateAnonymousAppUserId(): string {
  const existing = window.localStorage.getItem(ANON_USER_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated = Purchases.generateRevenueCatAnonymousAppUserId();
  window.localStorage.setItem(ANON_USER_ID_STORAGE_KEY, generated);
  return generated;
}

/**
 * `configure()` throws if called twice, but React Strict Mode / Fast Refresh
 * mount effects twice in dev — so always check `isConfigured()` first.
 */
export function getPurchases(): Purchases {
  if (Purchases.isConfigured()) {
    return Purchases.getSharedInstance();
  }

  const apiKey = process.env.NEXT_PUBLIC_RC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_RC_API_KEY. Add it to .env.local — see RevenueCat dashboard > Web Billing.",
    );
  }

  Purchases.setLogLevel(LogLevel.Debug);

  return Purchases.configure({
    apiKey,
    appUserId: getOrCreateAnonymousAppUserId(),
  });
}
