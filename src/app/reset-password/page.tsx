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
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex justify-center items-center w-full bg-gradient-to-br from-teal-500 via-green-300 to-teal-200 h-screen">
      <div className="w-full max-w-md mx-auto p-6 flex flex-col gap-3 border border-gray-200 bg-blue-100 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">Reset password</h2>

        {loading ? (
          <p>Checking token...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !email ? (
          <p className="text-sm text-gray-600">Enter a new password to reset your account.</p>
        ) : (
          <p className="text-sm text-gray-600">Resetting password for <strong>{email}</strong></p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <input
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={seePassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="New password"
              className="block w-full rounded-md border border-gray-300 shadow-sm p-2"
            />
            <button
              type="button"
              onClick={() => setSeePassword((p) => !p)}
              className="absolute h-full flex items-center justify-center right-2 top-0"
            >
              {seePassword ? <EyeClosed /> : <Eye />}
            </button>
          </div>

          <div className="relative">
            <input
              name="confirm"
              value={confirm}
              onChange={(e) => setConfirmPass(e.target.value)}
              type={seeConfirm ? "text" : "password"}
              minLength={6}
              placeholder="Confirm password"
              className="block w-full rounded-md border border-gray-300 shadow-sm p-2"
            />
            <button
              type="button"
              onClick={() => setConfirm((p) => !p)}
              className="absolute h-full flex items-center justify-center right-2 top-0"
            >
              {seeConfirm ? <EyeClosed /> : <Eye />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Reset password"}
            </button>
            <a href="/login" className="text-blue-600 hover:font-medium text-sm">
              Back to login
            </a>
          </div>
        </form>

        {!token && (
          <p className="mt-2 text-sm text-red-600">Warning: token not found or expired.</p>
        )}
      </div>
    </div>
  );
}
