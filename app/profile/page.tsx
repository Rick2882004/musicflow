"use client";

import ProtectedRoute from "../../src/components/auth/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-black text-white p-8">

        <div className="max-w-4xl mx-auto">

          <div
            className="
            rounded-3xl
            bg-zinc-900
            border
            border-white/10
            p-10
            "
          >

            <div className="flex items-center gap-8">

              <img
                src={
                  user?.photoURL ||
                  `https://ui-avatars.com/api/?name=${
                    user?.email || "MusicFlow"
                  }`
                }
                className="w-36 h-36 rounded-full"
              />

              <div>

                <h1 className="text-5xl font-bold">
                  {user?.displayName || "MusicFlow User"}
                </h1>

                <p className="text-zinc-400 mt-3">
                  {user?.email}
                </p>

                <p className="text-green-400 mt-4">
                  ● Logged In
                </p>

              </div>

            </div>

          </div>

        </div>

      </main>
    </ProtectedRoute>
  );
}