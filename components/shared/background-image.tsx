"use client";

import { useState, useEffect } from "react";

interface BackgroundImageProps {
  imagePath: string;
  className?: string;
  fallbackClassName?: string;
}

const BackgroundImage = ({
  imagePath,
  className = "",
  fallbackClassName = "bg-background",
}: BackgroundImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = imagePath;

    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    img.onerror = () => {
      setImageLoaded(false);
      setImageError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imagePath]);

  return (
    <div
      className={`${className} ${
        !imageLoaded || imageError ? fallbackClassName : ""
      } px-4 md:px-6 lg:px-0`}
      style={
        imageLoaded && !imageError
          ? {
              backgroundImage: `url(${imagePath})`,
              backgroundSize: "contain",
              backgroundPosition: "center bottom",
              backgroundRepeat: "no-repeat",
            }
          : undefined
      }
    />
  );
};

export default BackgroundImage;
