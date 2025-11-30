"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Custom hook that safely reads and updates URL search parameters
 * without requiring Suspense boundaries. Uses window.location.search
 * instead of useSearchParams() to avoid Suspense requirements.
 */
export function useSafeSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchParams, setSearchParams] = useState<URLSearchParams>(
    new URLSearchParams()
  );
  const [isClient, setIsClient] = useState(false);

  // Initialize and sync with URL
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
    }
  }, []);

  // Sync when pathname changes
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
  }, [pathname, isClient]);

  // Listen for popstate events (back/forward navigation)
  useEffect(() => {
    if (!isClient) return;

    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        setSearchParams(params);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isClient]);

  const updateSearchParams = (
    updater: (params: URLSearchParams) => void,
    options?: { replace?: boolean }
  ) => {
    if (typeof window === "undefined") return;

    const newParams = new URLSearchParams(window.location.search);
    updater(newParams);
    setSearchParams(newParams);

    const newUrl = `${window.location.pathname}${
      newParams.toString() ? `?${newParams.toString()}` : ""
    }`;
    
    if (options?.replace) {
      router.replace(newUrl, { scroll: false });
    } else {
      router.push(newUrl, { scroll: false });
    }
  };

  const get = (key: string): string | null => {
    return searchParams.get(key);
  };

  const set = (key: string, value: string, replace: boolean = true) => {
    updateSearchParams(
      (params) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      },
      { replace }
    );
  };

  const deleteParam = (key: string, replace: boolean = true) => {
    updateSearchParams(
      (params) => {
        params.delete(key);
      },
      { replace }
    );
  };

  return {
    get,
    set,
    delete: deleteParam,
    params: searchParams,
    update: updateSearchParams,
  };
}

