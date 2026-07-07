import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center font-sans dark:bg-black">
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          RevenueCat fullscreen paywall
        </h1>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          A reference implementation for rendering a purchases-js paywall
          fullscreen without the usual mobile Safari inset, keyboard, and
          viewport-height problems. See{" "}
          <code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-800">
            src/components/FullscreenPaywallStage.tsx
          </code>{" "}
          for the implementation.
        </p>
      </div>
      <Link
        href="/paywall"
        className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Launch fullscreen paywall
      </Link>
    </div>
  );
}
