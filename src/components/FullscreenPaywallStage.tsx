"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import type { PaywallPurchaseResult } from "@revenuecat/purchases-js";
import { getPurchases } from "@/lib/revenuecat";

type Status = "loading" | "ready" | "purchasing" | "purchased" | "error";

/**
 * Mobile Safari doesn't shrink `window.innerHeight`/`100vh` for the on-screen
 * keyboard, and toggles the address bar independently of both. `visualViewport`
 * is the only signal that reflects what's *actually* visible right now, so we
 * measure it directly instead of trusting any CSS viewport unit alone.
 */
function useVisualViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;

    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setHeight(viewport?.height ?? window.innerHeight);
      });
    };

    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return height;
}

/**
 * The SDK may leave its checkout container mounted (but childless) even when
 * checkout isn't active. Without this, that container's full-size hit-box
 * would silently swallow clicks meant for the paywall behind it.
 */
function useHasRenderedContent(ref: RefObject<HTMLElement | null>): boolean {
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const check = () => setHasContent(node.childElementCount > 0);
    check();

    const observer = new MutationObserver(check);
    observer.observe(node, { childList: true });
    return () => observer.disconnect();
  }, [ref]);

  return hasContent;
}

/** Locks background scroll so mobile Safari's chrome doesn't shift under the stage while it's open. */
function useBodyScrollLock() {
  useEffect(() => {
    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, []);
}

/** Nudges a focused input clear of the keyboard once Safari finishes animating it in. */
function useScrollFocusedInputIntoView(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 300);
    };

    node.addEventListener("focusin", onFocusIn);
    return () => node.removeEventListener("focusin", onFocusIn);
  }, [ref]);
}

export default function FullscreenPaywallStage() {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const paywallHostRef = useRef<HTMLDivElement>(null);
  const checkoutHostRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PaywallPurchaseResult | null>(null);

  const viewportHeight = useVisualViewportHeight();
  const paywallHasContent = useHasRenderedContent(paywallHostRef);
  const checkoutHasContent = useHasRenderedContent(checkoutHostRef);

  useBodyScrollLock();
  useScrollFocusedInputIntoView(checkoutHostRef);

  // Feed the SDK a container sized to what's actually visible right now,
  // rather than letting its own fullscreen overlay guess from `100vh`.
  useEffect(() => {
    if (viewportHeight == null || !stageRef.current) return;
    stageRef.current.style.setProperty("--stage-height", `${viewportHeight}px`);
  }, [viewportHeight]);

  const close = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const purchases = getPurchases();

    purchases
      .presentPaywall({
        htmlTarget: paywallHostRef.current!,
        purchaseHtmlTarget: checkoutHostRef.current!,
        onNavigateToUrl: (url) => {
          window.open(url, "_blank", "noopener,noreferrer");
        },
        onBack: (closePaywall) => closePaywall(),
        listener: {
          onPurchaseStarted: () => {
            if (!cancelled) setStatus("purchasing");
          },
          onPurchaseCancelled: () => {
            if (!cancelled) setStatus("ready");
          },
          onPurchaseError: (error) => {
            if (!cancelled) {
              setStatus("error");
              setErrorMessage(error.message);
            }
          },
        },
      })
      .then((purchaseResult) => {
        if (!cancelled) {
          setResult(purchaseResult);
          setStatus("purchased");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Something went wrong.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className="fixed inset-0 overflow-hidden bg-black"
      style={{
        height: "var(--stage-height, 100dvh)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <button
        type="button"
        onClick={close}
        aria-label="Close paywall"
        className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg text-white backdrop-blur"
      >
        &times;
      </button>

      <div className="grid h-full w-full" style={{ gridTemplateAreas: '"stack"' }}>
        <div
          ref={paywallHostRef}
          className="h-full w-full overflow-y-auto"
          style={{ gridArea: "stack" }}
        />
        <div
          ref={checkoutHostRef}
          className="h-full w-full overflow-y-auto"
          style={{
            gridArea: "stack",
            zIndex: 10,
            pointerEvents: checkoutHasContent ? "auto" : "none",
          }}
        />
      </div>

      {status === "loading" && !paywallHasContent && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/90 px-6 text-center text-white">
          <p className="text-sm text-white/70">
            {errorMessage ?? "Something went wrong loading the paywall."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black"
          >
            Try again
          </button>
        </div>
      )}

      {status === "purchased" && result && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/90 px-6 text-center text-white">
          <p className="text-lg font-medium">You&apos;re all set.</p>
          <p className="text-sm text-white/70">
            Active: {Array.from(result.customerInfo.activeSubscriptions).join(", ") || "—"}
          </p>
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
