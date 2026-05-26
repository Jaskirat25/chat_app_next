import React from "react";

/**
 * Generic pulse skeleton loader used throughout the chat UI.
 * It adapts to the surrounding dark/light theme via Tailwind's `bg-gray-300` which
 * works well with both background colors.
 */
export function SkeletonLoader({
  type = "list",
}: { type?: "list" | "message" }) {
  if (type === "message") {
    // Message bubble skeleton – mimics left aligned bubble shape
    return (
      <div className="flex w-full max-w-[75%] px-4 py-2.5 rounded-2xl bg-gray-300/30 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-24" />
      </div>
    );
  }

  // Default list (friend) skeleton
  return (
    <div className="flex items-center space-x-2 p-2 animate-pulse">
      <div className="rounded-full bg-gray-300 h-8 w-8" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gray-300 rounded w-1/2" />
      </div>
    </div>
  );
}
