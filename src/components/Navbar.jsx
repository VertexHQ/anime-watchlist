export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-purple-900/40 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3">
        <img alt="Anime Watchlist logo" className="h-8 w-8" src="/logo.svg" />
        <span className="text-lg font-bold tracking-wide text-white glow-text">Anime Watchlist</span>
      </div>
    </header>
  );
}
