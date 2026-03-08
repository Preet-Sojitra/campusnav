"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Logged in successfully!");
        onClose();
        // optionally refresh or sync
      }
    } else {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Registered successfully! Logging in...");
          await signIn("credentials", { redirect: false, email, password });
          onClose();
        } else {
          toast.error(data.error || "Registration failed");
        }
      } catch (err) {
        toast.error("Something went wrong");
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin
              ? "Sign in to access your saved schedules"
              : "Sign up to save your schedule across devices"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-nebula focus:ring-1 focus:ring-nebula/50"
              placeholder="temoc@utdallas.edu"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-nebula focus:ring-1 focus:ring-nebula/50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-nebula px-4 py-3 font-semibold text-white shadow-md transition-colors hover:bg-nebula-dark disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-bold text-nebula hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
