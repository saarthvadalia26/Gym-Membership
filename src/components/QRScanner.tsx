"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onScan: (token: string) => void;
  onClose: () => void;
}

/**
 * Camera-based QR scanner using html5-qrcode. Lazy-loaded so the heavy
 * scanner library only ships to browsers when the user actually opens it.
 */
export function QRScanner({ open, onScan, onClose }: Props) {
  const containerId = "qr-scanner-region";
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStarting(true);
    setError(null);

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const min = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(min * 0.7);
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Stop the camera before bubbling up to avoid double-scans
            scanner
              .stop()
              .catch(() => {})
              .finally(() => {
                onScan(decodedText.trim());
              });
          },
          () => {
            // ignore individual decode failures — keeps trying every frame
          }
        );
        if (cancelled) {
          await scanner.stop().catch(() => {});
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Could not start camera";
        setError(
          msg.includes("Permission") || msg.includes("NotAllowed")
            ? "Camera permission denied. Allow camera access in your browser and try again."
            : msg.includes("NotFound")
            ? "No camera found on this device."
            : msg
        );
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) {
        s.stop().catch(() => {});
      }
    };
  }, [open, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-brand-500" />
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Scan member QR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black">
          <div id={containerId} className="w-full h-full" />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Starting camera…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-sm p-6 text-center bg-slate-900/90">
              <AlertCircle size={32} className="text-red-400 mb-2" />
              {error}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
          Hold the member&apos;s QR inside the frame. They&apos;ll be checked in automatically.
        </p>
      </div>
    </div>
  );
}
