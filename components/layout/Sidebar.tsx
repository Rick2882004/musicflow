'use client'
// src/components/layout/Sidebar.tsx
import { List } from "lucide-react";
import { usePlayerStore } from "@/store/player-store";
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Search, Heart, ListMusic, Clock, Settings,
  Music2, Plus, ChevronRight, Compass
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },

{
  href: "/explore",
  icon: Compass,
  label: "Explore",
},

  
  { href: '/liked', icon: Heart, label: 'Liked Songs' },
  { href: '/playlists', icon: ListMusic, label: 'Playlists' },
  { href: '/recently-played', icon: Clock, label: 'Recently Played' },
  {
    href: "/queue",
    icon: List,
    label: "Queue",
  },
]
export function Sidebar() {
  const pathname = usePathname()
  const { playlists } = usePlayerStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="mf-sidebar">
        {/* Logo */}
        <div className="mf-sidebar__logo">
          <Music2 size={22} className="mf-sidebar__logo-icon" />
          <span className="mf-sidebar__logo-text">MusicFlow</span>
        </div>

        {/* Primary nav */}
        <nav className="mf-sidebar__nav" aria-label="Main navigation">
          <ul role="list">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn('mf-nav-link', active && 'mf-nav-link--active')}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} className="mf-nav-link__icon" />
                    <span className="mf-nav-link__label">{label}</span>
                    {active && <span className="mf-nav-link__pip" aria-hidden="true" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Divider */}
        <div className="mf-sidebar__divider" />

        {/* Playlists section */}
        <div className="mf-sidebar__section">
          <div className="mf-sidebar__section-header">
            <span className="mf-sidebar__section-title">Playlists</span>
            <button
              className="mf-sidebar__add-btn"
              aria-label="Create new playlist"
            >
              <Plus size={14} />
            </button>
          </div>

          <ul role="list" className="mf-sidebar__playlists">
            {playlists.map((pl: any) => (
              <li key={pl.id}>
                <Link
                  href={`/playlists/${pl.id}`}
                  className={cn(
                    'mf-playlist-link',
                    pathname === `/playlists/${pl.id}` && 'mf-playlist-link--active'
                  )}
                >
                  <span className="mf-playlist-link__name">{pl.name}</span>
                  <span className="mf-playlist-link__count">
  {pl.songs.length}
</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings at bottom */}
        <div className="mf-sidebar__footer">
          <Link href="/settings" className={cn('mf-nav-link', pathname === '/settings' && 'mf-nav-link--active')}>
            <Settings size={18} className="mf-nav-link__icon" />
            <span className="mf-nav-link__label">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile bottom navigation bar */}
      <nav className="mf-mobile-nav" aria-label="Mobile navigation">
        {[...NAV_ITEMS.slice(0, 4)].map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn('mf-mobile-nav__item', active && 'mf-mobile-nav__item--active')}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <style>{`
        /* ---- Sidebar shell ---- */
        .mf-sidebar {
          display: flex;
          flex-direction: column;
          width: var(--mf-sidebar-width);
          height: calc(100dvh - var(--mf-player-height));
          position: sticky;
          top: 0;
          background: var(--mf-bg-elevated);
          border-right: 1px solid var(--mf-border);
          padding: 20px 12px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* ---- Logo ---- */
        .mf-sidebar__logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 12px 20px;
        }
        .mf-sidebar__logo-icon {
          color: var(--mf-brand);
          flex-shrink: 0;
        }
        .mf-sidebar__logo-text {
          font-family: var(--mf-font-display);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.3px;
          background: linear-gradient(135deg, var(--mf-brand) 0%, #A78BFA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ---- Nav items ---- */
        .mf-sidebar__nav ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
        .mf-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--mf-radius-md);
          color: var(--mf-text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition:
            background var(--mf-duration-fast) var(--mf-ease),
            color var(--mf-duration-fast) var(--mf-ease);
          position: relative;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
        }
        .mf-nav-link:hover {
          background: var(--mf-bg-card);
          color: var(--mf-text-primary);
        }
        .mf-nav-link--active {
          background: var(--mf-brand-muted);
          color: var(--mf-text-primary);
        }
        .mf-nav-link--active .mf-nav-link__icon { color: var(--mf-brand); }
        .mf-nav-link__icon { flex-shrink: 0; transition: color var(--mf-duration-fast) var(--mf-ease); }
        .mf-nav-link__label { flex: 1; }
        .mf-nav-link__pip {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--mf-brand);
          flex-shrink: 0;
        }

        /* ---- Divider ---- */
        .mf-sidebar__divider {
          height: 1px;
          background: var(--mf-border);
          margin: 16px 12px;
        }

        /* ---- Playlists section ---- */
        .mf-sidebar__section { flex: 1; min-height: 0; }
        .mf-sidebar__section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px 10px;
        }
        .mf-sidebar__section-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--mf-text-muted);
        }
        .mf-sidebar__add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: var(--mf-radius-sm);
          color: var(--mf-text-muted);
          background: none;
          border: none;
          cursor: pointer;
          transition: color var(--mf-duration-fast), background var(--mf-duration-fast);
        }
        .mf-sidebar__add-btn:hover {
          color: var(--mf-text-primary);
          background: var(--mf-bg-card);
        }
        .mf-sidebar__playlists {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow-y: auto;
          max-height: 220px;
        }
        .mf-playlist-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 12px;
          border-radius: var(--mf-radius-sm);
          text-decoration: none;
          transition: background var(--mf-duration-fast);
        }
        .mf-playlist-link:hover { background: var(--mf-bg-card); }
        .mf-playlist-link--active { background: var(--mf-brand-muted); }
        .mf-playlist-link__name {
          font-size: 13px;
          color: var(--mf-text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        .mf-playlist-link--active .mf-playlist-link__name { color: var(--mf-text-primary); }
        .mf-playlist-link__count {
          font-size: 11px;
          color: var(--mf-text-muted);
          flex-shrink: 0;
        }

        /* ---- Footer ---- */
        .mf-sidebar__footer { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--mf-border); }

        /* ---- Mobile nav bar ---- */
        .mf-mobile-nav {
          display: none;
          position: fixed;
          bottom: var(--mf-player-height-mobile);
          left: 0; right: 0;
          height: 56px;
          background: var(--mf-bg-elevated);
          border-top: 1px solid var(--mf-border);
          z-index: 40;
          align-items: center;
          justify-content: space-around;
          padding: 0 4px;
        }
        .mf-mobile-nav__item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 6px 16px;
          border-radius: var(--mf-radius-md);
          text-decoration: none;
          color: var(--mf-text-muted);
          font-size: 10px;
          font-weight: 500;
          transition: color var(--mf-duration-fast);
        }
        .mf-mobile-nav__item--active { color: var(--mf-brand); }

        @media (max-width: 767px) {
          .mf-sidebar { display: none; }
          .mf-mobile-nav { display: flex; }
        }
      `}</style>
    </>
  )
}
