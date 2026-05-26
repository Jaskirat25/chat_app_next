"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Sun, Moon, LogOut, User as UserIcon } from "lucide-react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export default function CustomDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userInfo, setUserInfo] = useState<{ username?: string; email?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Determine initial theme
    const storedTheme = localStorage.getItem("app-theme") as "light" | "dark";
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.className = storedTheme;
    } else {
      document.documentElement.className = "dark";
    }

    // Decode token for user details
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

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("app-theme", nextTheme);
    document.documentElement.className = nextTheme;
  };

  const handleLogout = () => {
    Cookies.remove("auth-token");
    router.push("/login");
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-md hover:bg-app-hover text-app-text transition-colors flex items-center justify-center"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 backdrop-blur-xs"
        />
      )}

      {/* Drawer Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-app-sidebar border-r border-app-dark shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-app-dark flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-text-bright">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-app-text-muted hover:text-app-text-bright hover:bg-app-hover transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info Card */}
        <div className="p-5 border-b border-app-dark bg-app-bg/50 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-app-brand/20 border-2 border-app-brand flex items-center justify-center">
              <UserIcon size={32} className="text-app-brand" />
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-app-success border-2 border-app-sidebar rounded-full" />
          </div>
          <h3 className="font-semibold text-app-text-bright truncate max-w-full">
            {userInfo?.username || "Guest User"}
          </h3>
          <p className="text-xs text-app-text-muted truncate max-w-full mt-0.5">
            {userInfo?.email || "No email associated"}
          </p>
        </div>

        {/* Action List */}
        <div className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-app-hover text-app-text hover:text-app-text-bright transition-colors text-sm font-medium"
          >
            {theme === "dark" ? (
              <>
                <Sun size={18} className="text-yellow-500" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={18} className="text-indigo-400" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-app-dark mt-auto bg-app-bg/30">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-app-danger/10 text-app-text hover:text-app-danger transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
