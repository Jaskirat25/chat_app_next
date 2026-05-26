import React from "react";
import { SkeletonLoader } from "./SkeletonLoader";

/**
 * Skeleton placeholder for a conversation entry in the middle panel.
 * Mimics the layout of a real conversation list item.
 */
export function ConversationListSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-2 animate-pulse">
      {/* Avatar */}
      <SkeletonLoader type="avatar" width="w-10" height="h-10" />
      {/* Text lines */}
      <div className="flex-1 space-y-1">
        <SkeletonLoader type="text" width="w-[140px]" height="h-[14px]" />
        <SkeletonLoader type="text" width="w-[200px]" height="h-[11px]" />
      </div>
      {/* Timestamp */}
      <SkeletonLoader type="text" width="w-12" height="h-[14px]" />
    </div>
  );
}
