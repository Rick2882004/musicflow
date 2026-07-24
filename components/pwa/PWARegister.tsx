"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("MusicFlow ServiceWorker registered successfully:", registration.scope);
          })
          .catch((err) => {
            console.warn("MusicFlow ServiceWorker registration failed:", err);
          });
      });
    }
  }, []);

  return null;
}
