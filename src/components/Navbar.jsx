import { useState } from 'react';

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/salimuddin07',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/salimuddin007',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/salimuddin07',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/salimuddin07_',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.059 1.689.073 4.948.073 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/salimuddin007',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.931-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:contact@salimuddin.tech',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
];

const DISCORD_USERNAME = 'salimuddin07';

export default function Navbar({
  setupComplete = false,
  username = '',
  theme = 'dark',
  onToggleTheme,
  onUpdateSheetLink,
  onLogout,
}) {
  const [discordCopied, setDiscordCopied] = useState(false);
  const isLightTheme = theme === 'light';

  function copyDiscord() {
    navigator.clipboard.writeText(DISCORD_USERNAME).then(() => {
      setDiscordCopied(true);
      setTimeout(() => setDiscordCopied(false), 2000);
    });
  }

  return (
    <header className="app-navbar sticky top-0 z-50 border-b border-white/5 bg-transparent backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:flex-nowrap sm:py-1.5">
        <svg
          className="h-10 w-[180px] shrink-0 sm:h-12 sm:w-[220px]"
          viewBox="0 0 220 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed"/>
              <stop offset="100%" stopColor="#22d3ee"/>
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <text x="0" y="30" fontFamily="Orbitron, sans-serif" fontSize="30" fontWeight="700" fill="url(#neonGrad)" filter="url(#neonGlow)" letterSpacing="4">ANIME</text>
          <text x="2" y="45" fontFamily="Orbitron, sans-serif" fontSize="12" fill="#e5e7eb" letterSpacing="6" opacity="0.8">WATCHLIST</text>
          <line x1="0" y1="47.5" x2="218" y2="47.5" stroke="url(#neonGrad)" strokeWidth="1.5" opacity="0.5"/>
        </svg>

        <div className="flex flex-1 flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            aria-pressed={isLightTheme}
            className={`theme-toggle-btn rounded-md border px-3 py-1 text-xs font-semibold transition ${
              isLightTheme
                ? 'border-amber-400/65 bg-amber-100 text-amber-900 hover:border-amber-500 hover:bg-amber-200'
                : 'border-cyan-500/50 bg-cyan-900/25 text-cyan-100 hover:border-cyan-400 hover:bg-cyan-800/35'
            }`}
            onClick={() => onToggleTheme?.()}
            type="button"
          >
            {isLightTheme ? 'Light' : 'Dark'}
          </button>

          {setupComplete ? (
            <div className="account-panel flex flex-wrap items-center justify-end gap-2 rounded-lg border border-cyan-500/20 bg-black/45 px-2 py-1 shadow-[0_0_14px_rgba(34,211,238,0.08)]">
              <p
                className="max-w-[160px] truncate text-xs text-cyan-100/90"
                title={username || 'User'}
              >
                <span className="text-cyan-300/80">User:</span>{' '}
                <span className="font-semibold text-cyan-200">{username || 'User'}</span>
              </p>
              <button
                className="rounded-md border border-purple-500/50 bg-purple-700/35 px-2.5 py-1 text-xs font-medium text-purple-100 transition hover:border-purple-400 hover:bg-purple-600/45 hover:text-white"
                onClick={() => onUpdateSheetLink?.()}
                type="button"
              >
                Update Sheet Link
              </button>
              <button
                className="rounded-md border border-rose-500/55 bg-rose-600/25 px-2.5 py-1 text-xs font-medium text-rose-100 transition hover:border-rose-400 hover:bg-rose-500/35 hover:text-white"
                onClick={() => onLogout?.()}
                type="button"
              >
                Logout
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-1">
            {SOCIAL_LINKS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto') ? '_self' : '_blank'}
                rel="noreferrer"
                aria-label={label}
                title={label}
                className="social-link rounded-md p-2 text-gray-500 transition-colors duration-200 hover:bg-purple-950/50 hover:text-purple-400"
              >
                {icon}
              </a>
            ))}

            <button
              onClick={copyDiscord}
              aria-label="Discord"
              title={discordCopied ? 'Copied!' : `Discord: ${DISCORD_USERNAME}`}
              className="social-link relative rounded-md p-2 text-gray-500 transition-colors duration-200 hover:bg-purple-950/50 hover:text-purple-400"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              {discordCopied && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-purple-900/60 bg-black/80 px-2 py-0.5 text-xs text-purple-300">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
