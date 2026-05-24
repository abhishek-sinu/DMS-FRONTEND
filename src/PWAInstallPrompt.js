import React, { useState, useEffect } from 'react';

const DISMISS_KEY = 'pwa_install_dismissed_until';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — no prompt needed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone === true) return; // iOS standalone

    // Respect previous dismissal (7-day cooldown)
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) return;

    const handler = e => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show the banner after a short delay so it doesn't interrupt page load
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    // Don't show again for 7 days
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:w-[380px] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #1e3a5f, #2563eb, #1e40af)' }} />
        <div className="p-4 flex items-center gap-3">
          {/* Logo */}
          <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
            <img src="/logo.png" alt="ISKCON" className="w-10 h-10 object-contain" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm leading-tight">Install ISKCON DMS</p>
            <p className="text-xs text-gray-500 mt-0.5">Add to home screen for quick access — works offline too!</p>
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition flex-shrink-0 rounded-full hover:bg-gray-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        {/* Buttons */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 py-2 rounded-xl text-white text-sm font-bold transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)' }}
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold transition"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
