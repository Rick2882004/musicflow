"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Compass, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { name: "Home",    href: "/",        icon: Home    },
  { name: "Search",  href: "/search",  icon: Search  },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Library", href: "/library", icon: Library },
  { name: "Profile", href: "/profile", icon: User    },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around pb-safe bg-[#09090e] border-t border-white/[0.08] h-[56px]"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;

        return (
          <Link
            key={tab.name}
            href={tab.href}
            aria-label={tab.name}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 w-16 min-h-[52px] rounded-xl transition-all duration-150 active:scale-90"
            )}
          >
            {/* Active background pill */}
            {isActive && (
              <motion.div
                layoutId="mobileNavPill"
                className="absolute inset-0 rounded-xl"
                style={{ background: "rgba(124,58,237,0.10)" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <Icon
              size={19}
              className={cn("relative z-10 transition-colors duration-150")}
              style={{ color: isActive ? "var(--mf-accent-light)" : "var(--mf-text-dim)" }}
            />

            <span
              className={cn(
                "relative z-10 text-[9px] font-bold tracking-wide transition-colors duration-150"
              )}
              style={{ color: isActive ? "var(--mf-accent-light)" : "var(--mf-text-dim)" }}
            >
              {tab.name}
            </span>

            {/* Active underline dot */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  key="dot"
                  layoutId="mobileNavDot"
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: "var(--mf-accent-light)" }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </nav>
  );
}

