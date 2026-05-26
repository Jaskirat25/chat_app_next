import React from "react";
import { SkeletonLoader } from "./SkeletonLoader";

/**
 * Skeleton placeholder for a single message in the chat thread.
 * It supports left (received) and right (sent) alignment.
 */
export function MessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  const isLeft = align === "left";
  const bubbleWidth = `${Math.floor(160 + Math.random() * 100)}px`;
  const bubbleHeight = `${Math.floor(36 + Math.random() * 24)}px`;

  return (
    <div className={`flex items-start ${isLeft ? "space-x-2" : "flex-row-reverse space-x-2"} py-2`}>
      {isLeft && (
        <SkeletonLoader type="avatar" width="w-8" height="h-8" />
      )}
      <div className={`flex flex-col ${isLeft ? "items-start" : "items-end"} space-y-1`}>
        <SkeletonLoader
          type="text"
          customStyle={{ width: bubbleWidth, height: bubbleHeight, backgroundColor: isLeft ? "#2a2f45" : "#5865F2" }}
        />
        <SkeletonLoader type="text" width="w-12" height="h-[10px]" />
      </div>
    </div>
  );
}
