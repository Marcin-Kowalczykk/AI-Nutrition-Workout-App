// hooks
import { useState } from "react";

export const useRpeState = () => {
  const [rpeOpenBySet, setRpeOpenBySet] = useState<Record<string, boolean>>({});
  const [rpeSliderDisplayBySet, setRpeSliderDisplayBySet] = useState<
    Record<string, number>
  >({});

  const openRpePanel = (rpeKey: string, currentValue: number | null | undefined) => {
    setRpeOpenBySet((prev) => ({ ...prev, [rpeKey]: true }));
    setRpeSliderDisplayBySet((prev) => {
      if (prev[rpeKey] !== undefined) return prev;
      return { ...prev, [rpeKey]: currentValue ?? 5 };
    });
  };

  const closeRpePanel = (rpeKey: string) => {
    setRpeOpenBySet((prev) => ({ ...prev, [rpeKey]: false }));
  };

  const toggleRpePanel = (rpeKey: string, currentValue: number | null | undefined) => {
    const isOpen = rpeOpenBySet[rpeKey] === true;
    if (isOpen) {
      closeRpePanel(rpeKey);
    } else {
      openRpePanel(rpeKey, currentValue);
    }
  };

  const clearRpeDisplay = (rpeKey: string) => {
    setRpeSliderDisplayBySet((prev) => {
      const next = { ...prev };
      delete next[rpeKey];
      return next;
    });
    closeRpePanel(rpeKey);
  };

  const setRpeDisplay = (rpeKey: string, value: number) => {
    setRpeSliderDisplayBySet((prev) => ({ ...prev, [rpeKey]: value }));
  };

  return {
    rpeOpenBySet,
    rpeSliderDisplayBySet,
    toggleRpePanel,
    clearRpeDisplay,
    setRpeDisplay,
  };
};

export type UseRpeStateReturn = ReturnType<typeof useRpeState>;
