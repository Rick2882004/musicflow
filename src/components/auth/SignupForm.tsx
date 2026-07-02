"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { auth, database } from "../../lib/firebase";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";

export default function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSignup = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

console.log("USER CREATED:", user.uid);

// TEMPORARILY COMMENT OUT DATABASE WRITE

/*
await set(
  ref(database, `users/${user.uid}`),
  {
    uid: user.uid,
    name,
    email,
    avatar: "",
    createdAt: Date.now(),

    likedSongs: {},
    playlists: {},

    recentlyPlayed: {},
  }
);
*/

alert("Signup Success 🎉");

router.push("/");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSignup}
      className="space-y-5"
    >
      <input
        placeholder="Full Name"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 outline-none"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 outline-none"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 outline-none"
      />

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 outline-none"
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
      "
      >
        {loading
          ? "Creating Account..."
          : "Create Account"}
      </button>
    </form>
  );
}