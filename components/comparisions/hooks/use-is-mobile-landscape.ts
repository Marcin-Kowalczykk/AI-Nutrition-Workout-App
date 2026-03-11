import { useEffect, useState } from "react";

export const useIsMobileLandscape = () => {
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return;
      const { innerWidth, innerHeight } = window;
      const isLandscape = innerWidth > innerHeight;
      const isMobile = innerWidth < 1024;
      setIsMobileLandscape(isLandscape && isMobile);
    };

    update();

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobileLandscape;
};

