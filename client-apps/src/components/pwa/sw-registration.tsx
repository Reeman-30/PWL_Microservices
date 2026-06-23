"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      // ✅ Aktifkan untuk development juga agar bisa testing offline
      process.env.NODE_ENV === "production"
    ) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("✅ Service Worker registered:", reg);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("🔄 New version available!");
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Check for updates every hour
          setInterval(
            () => {
              reg.update();
            },
            60 * 60 * 1000,
          );
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("🔄 Controller changed, reloading page...");
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div
      className="position-fixed bottom-0 start-50 translate-middle-x mb-3"
      style={{ zIndex: 9999, maxWidth: "500px", width: "90%" }}
    >
      <div
        className="alert alert-info alert-dismissible fade show shadow-lg mb-0"
        role="alert"
      >
        <div className="d-flex align-items-center">
          <i className="bi bi-info-circle-fill me-3 fs-4"></i>
          <div className="flex-grow-1">
            <h6 className="alert-heading mb-1">Update Tersedia!</h6>
            <p className="mb-2 small">
              Versi baru aplikasi telah tersedia. Klik tombol di bawah untuk
              memperbarui.
            </p>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleUpdate}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Update Sekarang
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleDismiss}
              >
                Nanti Saja
              </button>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={handleDismiss}
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
  );
}
