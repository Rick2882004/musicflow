"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login Successful 🎉");

      router.push("/");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="space-y-5"
    >
      <input
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="
          w-full
          h-14
          px-5
          rounded-2xl
          bg-white/5
          border
          border-white/10
          outline-none
          focus:border-purple-500
        "
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="
          w-full
          h-14
          px-5
          rounded-2xl
          bg-white/5
          border
          border-white/10
          outline-none
          focus:border-purple-500
        "
      />

      <button
        type="submit"
        disabled={loading}
        className="
          w-full
          h-14
          rounded-2xl
          bg-gradient-to-r
          from-purple-600
          to-blue-600
          font-bold
          hover:scale-[1.02]
          transition
          disabled:opacity-50
          disabled:cursor-not-allowed
        "
      >
        {loading ? "Logging in..." : "Login"}
      </button>
      <div className="text-center pt-2">
  <p className="text-zinc-400">
    Don't have an account?{" "}
    <Link
      href="/signup"
      className="text-purple-400 hover:text-purple-300 font-semibold"
    >
      Create one
    </Link>
  </p>
</div>
    </form>
  );
}