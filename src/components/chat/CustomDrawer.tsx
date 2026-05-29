"use client";

import React, { useEffect, useState } from "react";
import { LogOut, Menu, Moon, Sun, User as UserIcon, X } from "lucide-react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/theme-context";

export default function CustomDrawer({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    email?: string;
  } | null>(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const token = Cookies.get("auth-token");
    if (token) {
      try {
        const decoded = jwtDecode<{ username?: string; email?: string }>(token);
        setUserInfo(decoded);
      } catch (err) {
        console.error("Failed to decode token in Drawer", err);
      }
    }
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    Cookies.remove("auth-token");
    router.push("/login");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/78 transition-all duration-300 hover:bg-white/16 hover:text-white ${
          compact ? "h-10 w-10" : "p-1.5"
        }`}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300"
          aria-label="Close navigation menu"
        />
      </div>

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`glass-panel fixed left-0 top-0 z-50 flex h-full w-full max-w-[320px] transform flex-col rounded-none border border-white/10 bg-white/10 p-0 shadow-2xl transition-all duration-300 ease-out sm:rounded-[28px] sm:left-4 sm:top-3 sm:h-[calc(100dvh-24px)] sm:w-[320px] ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
      >
        <div className="flex min-h-[72px] items-center justify-between border-b border-white/[0.08] px-4 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Header Menu
            </p>
            <h2 className="text-xl font-semibold text-white">Workspace</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-white/70 transition-colors duration-200 hover:bg-white/12 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/[0.08] p-5 text-center">
          <div className="relative mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/10 shadow-inner shadow-white/5">
            <div className="flex h-full w-full items-center justify-center text-xl text-white/90">
              <UserIcon size={30} />
            </div>
            <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border border-black/70 bg-[#4CD964] shadow-[0_0_12px_rgba(76,217,100,0.35)]" />
          </div>
          <p className="truncate text-base font-semibold text-white">
            {userInfo?.username || "Guest User"}
          </p>
          <p className="mt-1 truncate text-sm text-white/60">
            {userInfo?.email || "guest@chatapp.com"}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          <button
            onClick={toggleTheme}
            className="group flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white/80 transition duration-300 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <span className="flex items-center gap-3">
              {theme === "dark" ? (
                <Sun size={18} className="text-amber-300" />
              ) : (
                <Moon size={18} className="text-violet-300" />
              )}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/60 transition-all duration-300 group-hover:bg-white/15">
              {theme === "dark" ? "Switch" : "Switch"}
            </span>
          </button>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-sm font-semibold text-white">Theme</p>
            <p className="mt-1 text-xs leading-5 text-white/50">
              {theme === "dark"
                ? "Deep glass dark with blue accents and cool contrast."
                : "Soft light palette with minimal glass surfaces."}
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-white/[0.08] bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 backdrop-blur-xl">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#F87171] via-[#E11D48] to-[#B91C1C] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(232,121,121,0.25)] transition duration-300 hover:shadow-[0_22px_48px_rgba(232,121,121,0.35)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-red-400/30"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
