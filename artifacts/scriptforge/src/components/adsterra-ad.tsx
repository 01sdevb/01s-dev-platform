import { useEffect, useRef } from "react";

type AdFormat = "160x300" | "160x600" | "300x250" | "320x50" | "468x60" | "728x90" | "native";

const IFRAME_KEYS: Record<Exclude<AdFormat, "native">, { key: string; width: number; height: number }> = {
  "160x300": { key: "a3f917d9f9c2ef8e0631537c92018234", width: 160, height: 300 },
  "160x600": { key: "451b27abcf34089c2a5474715462a022", width: 160, height: 600 },
  "300x250": { key: "9e9115906fab18cc6ff27c8deef2d74d", width: 300, height: 250 },
  "320x50":  { key: "8822fec6c4e4614f8547363b6e0fa586", width: 320, height: 50 },
  "468x60":  { key: "e5b8832abc8f68505fbc29bf5f01fd92", width: 468, height: 60 },
  "728x90":  { key: "5a6fe7b4d896038d5a68a9ea23a77dc6", width: 728, height: 90 },
};

const NATIVE_CONTAINER_ID = "container-f9a8370772d0f1c2eef95fc947e949e7";
const NATIVE_SRC = "https://pl29188291.profitablecpmratenetwork.com/f9a8370772d0f1c2eef95fc947e949e7/invoke.js";

interface AdsterraAdProps {
  format: AdFormat;
  className?: string;
}

export function AdsterraAd({ format, className }: AdsterraAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    if (format === "native") {
      const div = document.createElement("div");
      div.id = NATIVE_CONTAINER_ID;
      container.appendChild(div);

      const script = document.createElement("script");
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      script.src = NATIVE_SRC;
      container.appendChild(script);
      return;
    }

    const cfg = IFRAME_KEYS[format];
    const optsScript = document.createElement("script");
    optsScript.type = "text/javascript";
    optsScript.text = `atOptions = { 'key':'${cfg.key}', 'format':'iframe', 'height':${cfg.height}, 'width':${cfg.width}, 'params':{} };`;
    container.appendChild(optsScript);

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src = `https://www.highperformanceformat.com/${cfg.key}/invoke.js`;
    container.appendChild(invokeScript);
  }, [format]);

  const dims = format === "native" ? undefined : IFRAME_KEYS[format];
  const style = dims ? { minWidth: dims.width, minHeight: dims.height } : undefined;

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center overflow-hidden mx-auto ${className ?? ""}`}
      style={style}
      aria-label="advertisement"
    />
  );
}

let globalAdsLoaded = false;

export function GlobalAdsterraScripts() {
  useEffect(() => {
    if (globalAdsLoaded) return;
    globalAdsLoaded = true;

    const popunder = document.createElement("script");
    popunder.src = "https://pl29188288.profitablecpmratenetwork.com/6b/f7/93/6bf7939d1f1e27a2e22c881418718040.js";
    document.body.appendChild(popunder);

    const socialBar = document.createElement("script");
    socialBar.src = "https://pl29188290.profitablecpmratenetwork.com/65/85/2a/65852a316e4c3f6632b3d6f0c450dae9.js";
    document.body.appendChild(socialBar);

    let lastTrigger = 0;
    const COOLDOWN_MS = 30_000;

    const handler = (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      const button = target.closest("button") as HTMLButtonElement | null;
      const trigger = anchor || button;
      if (!trigger) return;
      if (trigger.closest("[data-no-ad]")) return;
      const now = Date.now();
      if (now - lastTrigger < COOLDOWN_MS) return;
      lastTrigger = now;
      try {
        window.open(SMARTLINK_URL, "_blank", "noopener,noreferrer");
      } catch {
        /* popup blocked */
      }
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return null;
}

export const SMARTLINK_URL = "https://www.profitablecpmratenetwork.com/xq3cf1et?key=c881e8976651c8b9895d1ebae0b2c7d2";
