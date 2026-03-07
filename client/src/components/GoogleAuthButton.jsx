import { useEffect, useRef, useState } from "react";
import { authService } from "../services/authService";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();

  if (window.__googleScriptPromise) {
    return window.__googleScriptPromise;
  }

  window.__googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return window.__googleScriptPromise;
};

export default function GoogleAuthButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const renderGoogleButton = async () => {
      let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        try {
          const data = await authService.getGoogleClientId();
          clientId = data?.clientId;
        } catch {
          clientId = "";
        }
      }

      if (!clientId) {
        if (mounted) setError("Google sign-in is not configured.");
        return;
      }

      try {
        await loadGoogleScript();
        if (!mounted || !buttonRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onCredential(response.credential);
            }
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          width: 320,
          text: "continue_with",
          shape: "pill",
        });
      } catch {
        if (mounted) setError("Unable to load Google sign-in.");
      }
    };

    renderGoogleButton();

    return () => {
      mounted = false;
    };
  }, [onCredential]);

  return (
    <div className="space-y-2">
      <div
        className={disabled ? "pointer-events-none opacity-60" : "pointer-events-auto opacity-100"}
      >
        <div ref={buttonRef} className="flex justify-center" />
      </div>
      {error && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">{error}</p>
      )}
    </div>
  );
}
