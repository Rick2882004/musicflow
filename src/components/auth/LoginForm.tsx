"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setSuccessMsg("Login Successful! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: unknown) {
      setErrorMsg((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="space-y-4"
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-semibold text-center">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold text-center animate-pulse">
          {successMsg}
        </div>
      )}
      <div className="relative">
        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-650" />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="
            w-full
            h-11
            pl-10
            pr-4
            rounded-xl
            bg-white/[0.02]
            border
            border-white/[0.05]
            outline-none
            text-xs
            font-semibold
            text-white
            placeholder:text-zinc-650
            focus:border-purple-550
            transition-colors
          "
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-650" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="
            w-full
            h-11
            pl-10
            pr-10
            rounded-xl
            bg-white/[0.02]
            border
            border-white/[0.05]
            outline-none
            text-xs
            font-semibold
            text-white
            placeholder:text-zinc-650
            focus:border-purple-550
            transition-colors
          "
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-3.5 text-zinc-600 hover:text-white"
        >
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          h-11
          rounded-full
          bg-white
          hover:bg-zinc-150
          text-black
          font-black
          text-xs
          flex
          items-center
          justify-center
          gap-2
          transition
          active:scale-95
          disabled:opacity-50
          disabled:cursor-not-allowed
          cursor-pointer
          shadow-md
        "
      >
        {loading ? "Logging in..." : "Login"} <ArrowRight size={13} />
      </button>

      <div className="text-center pt-3 border-t border-white/5 mt-4">
        <p className="text-[11px] text-zinc-555 font-bold">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-purple-400 hover:text-purple-300 transition"
          >
            Create one
          </Link>
        </p>
      </div>
    </form>
  );
}