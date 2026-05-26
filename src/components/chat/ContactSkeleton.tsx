import React from "react";
import { SkeletonLoader } from "./SkeletonLoader";

/**
 * Skeleton placeholder for a single contact in the sidebar.
 * Layout mimics the real UserListItem structure.
 */
export function ContactSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-2 animate-pulse">
      {/* Avatar */}
      <SkeletonLoader type="avatar" width="w-10" height="h-10" />
      {/* Text lines */}
      <div className="flex-1 space-y-1">
        <SkeletonLoader type="text" width="w-[120px]" height="h-[14px]" />
        <SkeletonLoader type="text" width="w-[180px]" height="h-[11px]" />
      </div>
      {/* Timestamp */}
      <SkeletonLoader type="text" width="w-10" height="h-[14px]" />
    </div>
  );
}
