"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../lib/axios";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seePassword, setSeePassword] = useState(false);
  const [seeConfirm, setConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirmPass] = useState("");

  useEffect(() => {
    const fetchEmail = async () => {
      if (!token) return;
      setLoading(true);
      const response = await api.post("api/getEmail", {token});
      setEmail(response.data.email);
      setLoading(false);
    };
    fetchEmail();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Token missing");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (res.status==200) {
        toast.success("Password reset successful");
        router.push("/login");
        
      } else {
        toast.error(json?.message || "Failed to reset password");
      }
    } catch (err) {
      toast.error("Server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg relative overflow-hidden p-4">
      <div className="relative z-10 w-full max-w-md bg-app-sidebar rounded-2xl shadow-2xl border border-app-dark p-8 sm:p-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-app-text-bright mb-2">Reset Password</h2>
          {loading ? (
            <p className="text-app-text-muted text-sm">Checking token...</p>
          ) : !email ? (
            <p className="text-app-text-muted text-sm">Enter a new password to reset your account.</p>
          ) : (
            <p className="text-app-text-muted text-sm">Resetting password for <strong className="text-app-text-bright">{email}</strong></p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-bold text-app-text-muted uppercase tracking-wide mb-2 block">
              New Password
            </label>
            <div className="relative">
              <input
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={seePassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="New password"
                className="w-full bg-app-input text-app-text-bright border border-transparent rounded-lg py-3 px-4 focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none transition"
              />
              <button
                type="button"
                onClick={() => setSeePassword((p) => !p)}
                className="absolute h-full flex items-center justify-center right-3 top-0 text-app-text-muted hover:text-app-text-bright"
              >
                {seePassword ? <EyeClosed size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-app-text-muted uppercase tracking-wide mb-2 block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                name="confirm"
                value={confirm}
                onChange={(e) => setConfirmPass(e.target.value)}
                type={seeConfirm ? "text" : "password"}
                minLength={6}
                placeholder="Confirm password"
                className="w-full bg-app-input text-app-text-bright border border-transparent rounded-lg py-3 px-4 focus:border-app-brand focus:ring-1 focus:ring-app-brand outline-none transition"
              />
              <button
                type="button"
                onClick={() => setConfirm((p) => !p)}
                className="absolute h-full flex items-center justify-center right-3 top-0 text-app-text-muted hover:text-app-text-bright"
              >
                {seeConfirm ? <EyeClosed size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-app-brand hover:bg-app-brand-hover text-white font-semibold py-3 rounded-lg shadow-md transition-all mt-4 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Processing..." : "Reset Password"}
          </button>

          <div className="text-center mt-2">
            <a href="/login" className="text-app-brand font-semibold hover:underline text-sm transition">
              Back to login
            </a>
          </div>
        </form>

        {!token && (
          <p className="mt-4 text-center text-sm text-app-danger">Warning: token not found or expired.</p>
        )}
      </div>
    </div>
  );
}
