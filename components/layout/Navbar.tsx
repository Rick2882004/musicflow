"use client";

import Link from "next/link";
import {
  useRouter,
  usePathname,
} from "next/navigation";
import {
  useState,
  useEffect,
  useRef,
} from "react";

import { signOut } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import { useAuth } from "../../src/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading } = useAuth();

  const [open, setOpen] = useState(false);

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const navLink = (
    href: string,
    label: string
  ) => (
    <Link
      href={href}
      className={`
        px-4
        py-2
        rounded-full
        transition-all
        duration-300
        ${
          pathname === href
            ? "bg-purple-600/20 text-purple-400"
            : "text-zinc-300 hover:text-white hover:bg-white/5"
        }
      `}
    >
      {label}
    </Link>
  );

  return (
    <header
      className="
        sticky
        top-0
        z-50
        backdrop-blur-3xl
        bg-black/40
        border-b
        border-white/10
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          h-20
          px-8
          flex
          items-center
          justify-between
        "
      >
        {/* Logo */}

        <Link
          href="/"
          className="
            flex
            items-center
            gap-3
          "
        >
          <img
            src="/logo.png"
            className="w-11 h-11"
            alt="MusicFlow"
          />

          <span
            className="
              text-3xl
              font-black
              bg-gradient-to-r
              from-purple-400
              to-pink-500
              bg-clip-text
              text-transparent
            "
          >
            MusicFlow
          </span>
        </Link>

        {/* Navigation */}

        <nav className="flex items-center gap-3">
          {navLink("/", "Home")}
          {navLink("/search", "Search")}
          {navLink("/library", "Library")}
          {navLink("/liked", "Liked")}
        </nav>

        {/* Right */}

        {loading ? (
          <div className="w-12 h-12 rounded-full bg-zinc-800 animate-pulse" />
        ) : user ? (
          <div
            className="relative"
            ref={dropdownRef}
          >
            <button
              onClick={() =>
                setOpen(!open)
              }
              className="
                flex
                items-center
                gap-3
                bg-zinc-900
                border
                border-white/10
                rounded-full
                px-3
                py-2
                hover:border-purple-500
                transition
              "
            >
              <img
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?background=7c3aed&color=fff&name=${
                    user.displayName ||
                    user.email
                  }`
                }
                alt=""
                className="w-10 h-10 rounded-full"
              />

              <div className="hidden lg:block text-left">
                <p className="font-semibold">
                  {user.displayName ||
                    "MusicFlow"}
                </p>

                <p className="text-xs text-zinc-400">
                  {user.email}
                </p>
              </div>
            </button>

            {open && (
              <div
                className="
                  absolute
                  right-0
                  mt-3
                  w-64
                  rounded-3xl
                  bg-zinc-900/95
                  backdrop-blur-3xl
                  border
                  border-white/10
                  overflow-hidden
                  shadow-2xl
                "
              >
                <button
                  onClick={() => {
                    router.push(
                      "/profile"
                    );
                    setOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition"
                >
                  👤 Profile
                </button>

                <button
                  onClick={() => {
                    router.push(
                      "/library"
                    );
                    setOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition"
                >
                  📚 Library
                </button>

                <button
                  onClick={() => {
                    router.push(
                      "/liked"
                    );
                    setOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition"
                >
                  ❤️ Liked Songs
                </button>

                <button
                  onClick={() => {
                    router.push(
                      "/playlists"
                    );
                    setOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition"
                >
                  🎵 Playlists
                </button>

                <button
                  onClick={() => {
                    router.push(
                      "/settings"
                    );
                    setOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-white/5 transition"
                >
                  ⚙️ Settings
                </button>

                <div className="border-t border-white/10" />

                <button
                  onClick={logout}
                  className="
                    w-full
                    text-left
                    px-6
                    py-4
                    text-red-400
                    hover:bg-red-500/10
                    transition
                  "
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() =>
              router.push("/login")
            }
            className="
              px-7
              py-3
              rounded-full
              bg-gradient-to-r
              from-purple-600
              to-blue-600
              font-semibold
              hover:scale-105
              transition
            "
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}