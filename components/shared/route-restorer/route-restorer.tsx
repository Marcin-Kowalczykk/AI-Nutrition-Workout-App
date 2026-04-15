"use client";

// libs
import { useEffect, useRef, useState } from "react";

// hooks
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// components
import { Loader } from "@/components/shared/loader";

const ROUTE_KEY = "pwa-last-route";

export const RouteRestorer = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasRestored = useRef(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    try {
      const saved = localStorage.getItem(ROUTE_KEY);
      if (saved && saved !== pathname) {
        setIsRedirecting(true);
        router.replace(saved);
      }
    } catch {
      // localStorage unavailable (private mode edge case)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRedirecting) setIsRedirecting(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const qs = searchParams.toString();
    const full = pathname + (qs ? `?${qs}` : "");
    try {
      localStorage.setItem(ROUTE_KEY, full);
    } catch {
      // localStorage unavailable
    }
  }, [pathname, searchParams]);

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

export const clearLastRoute = () => {
  try {
    localStorage.removeItem(ROUTE_KEY);
  } catch {
    // localStorage unavailable
  }
};
