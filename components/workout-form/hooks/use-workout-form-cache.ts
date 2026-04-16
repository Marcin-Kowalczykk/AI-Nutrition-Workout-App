"use client";

//libs
import { useEffect, useCallback, useRef } from "react";

//hooks
import type { UseFormReturn } from "react-hook-form";

//libs
import { removeFormCache, setFormCache } from "@/lib/form-cache";

//types
import type { CreateWorkoutFormType } from "../types";

interface UseWorkoutFormCacheProps {
  form: UseFormReturn<CreateWorkoutFormType>;
  cacheKey: string;
  discardRef: React.MutableRefObject<(() => void) | null>;
  formValues: CreateWorkoutFormType;
}

export const useWorkoutFormCache = ({
  form,
  cacheKey,
  discardRef,
  formValues,
}: UseWorkoutFormCacheProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);

  const saveToCache = useCallback(
    (data: CreateWorkoutFormType) => {
      setFormCache(cacheKey, JSON.stringify(data));
    },
    [cacheKey]
  );

  const clearCache = useCallback(() => {
    removeFormCache(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    discardRef.current = clearCache;
    return () => {
      discardRef.current = null;
    };
  }, [discardRef, clearCache]);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveToCache(form.getValues());
    }, 2000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [formValues, form, saveToCache]);

  return { saveToCache, clearCache };
};
