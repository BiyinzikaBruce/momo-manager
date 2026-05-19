"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D12]">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-500/12 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-alert-triangle text-red-400 text-xl" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-white/50 text-sm mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex px-6 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#E040A0] to-[#FF6B35] hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
