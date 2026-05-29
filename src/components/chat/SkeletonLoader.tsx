import React from "react";

interface SkeletonLoaderProps {
  type?: "list" | "message" | "avatar" | "text";
  width?: string;
  height?: string;
  className?: string;
  customStyle?: React.CSSProperties;
}

export function SkeletonLoader({
  type = "list",
  width,
  height,
  className = "",
  customStyle,
}: SkeletonLoaderProps) {
  if (type === "avatar") {
    return (
      <div
        className={`${width || "w-11"} ${height || "h-11"} rounded-full bg-white/[0.12] ${className}`}
        style={customStyle}
      />
    );
  }

  if (type === "text" || type === "message") {
    return (
      <div
        className={`${width || "w-24"} ${height || "h-4"} rounded-2xl bg-white/[0.12] ${className}`}
        style={customStyle}
      />
    );
  }

  return (
    <div className={`flex animate-pulse items-center gap-3 p-2 ${className}`}>
      <div className="h-11 w-11 rounded-full bg-white/[0.12]" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 rounded-full bg-white/[0.12]" />
        <div className="h-3 w-1/2 rounded-full bg-white/[0.10]" />
      </div>
    </div>
  );
}
