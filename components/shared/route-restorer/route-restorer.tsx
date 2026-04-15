"use client";

// libs
import { useEffect, useRef, useState } from "react";

// hooks
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// components
import { Loader } from "@/components/shared/loader";
import { createClient } from "@/lib/supabase/client";

const ROUTE_KEY_PREFIX = "pwa-last-route";
// sessionStorage: persists within a browser tab/session, cleared when PWA is killed or tab closed
// This ensures restore runs only once per PWA launch, not on every hard navigation
const SESSION_RESTORED_KEY = "pwa-route-restored";

const getRouteKey = (userId: string) => `${ROUTE_KEY_PREFIX}-${userId}`;

export const RouteRestorer = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasRun = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // hasRun guards against React Strict Mode double-invocation
    if (hasRun.current) return;
    hasRun.current = true;

    let alreadyRestored = false;
    try {
      alreadyRestored = !!sessionStorage.getItem(SESSION_RESTORED_KEY);
    } catch {
      // sessionStorage unavailable — skip restore entirely
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);

      if (!uid || alreadyRestored) return;

      try {
        sessionStorage.setItem(SESSION_RESTORED_KEY, "1");
        const saved = localStorage.getItem(getRouteKey(uid));
        if (saved && saved !== pathname) {
          setIsRedirecting(true);
          router.replace(saved);
        }
      } catch {
        // localStorage unavailable
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRedirecting) setIsRedirecting(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) return;
    const qs = searchParams.toString();
    const full = pathname + (qs ? `?${qs}` : "");
    try {
      localStorage.setItem(getRouteKey(userId), full);
    } catch {
      // localStorage unavailable
    }
  }, [pathname, searchParams, userId]);

  if (isRedirecting) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <Loader />
      </div>
    );
  }

  return null;
};

export const clearLastRoute = (userId?: string) => {
  try {
    // Clear the session flag so the next login can restore again if needed
    sessionStorage.removeItem(SESSION_RESTORED_KEY);
    if (userId) {
      localStorage.removeItem(getRouteKey(userId));
    } else {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(ROUTE_KEY_PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    // storage unavailable
  }
};
