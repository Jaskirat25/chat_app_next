// src/components/voice/AudioPlayer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

/**
 * Simple audio player for voice messages.
 * `src` is the Cloudinary URL.
 */
export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load metadata
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoaded = () => {
      setDuration(el.duration);
      setLoading(false);
    };
    const onTime = () => setCurrent(el.currentTime);
    const onEnd = () => setPlaying(false);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnd);
    };
  }, [src]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause(); else el.play();
    setPlaying(!playing);
  };

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    if (audioRef.current) audioRef.current.currentTime = percent * duration;
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-xs">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
        title={playing ? "Pause" : "Play"}
      >
        {loading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : playing ? (
          <Pause size={16} />
        ) : (
          <Play size={16} />
        )}
      </button>
      <div
        className="relative h-2 flex-1 bg-slate-600 rounded-full cursor-pointer"
        onClick={seek}
      >
        <div
          className="absolute h-2 bg-indigo-500 rounded-full"
          style={{ width: `${(current / duration) * 100}%` }}
        />
      </div>
      <span className="text-xs text-slate-300 tabular-nums min-w-[3ch]">
        {fmt(current)} / {fmt(duration)}
      </span>
    </div>
  );
}
