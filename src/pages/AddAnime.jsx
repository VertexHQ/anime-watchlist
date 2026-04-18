import AnimeForm from '../components/AnimeForm';

export default function AddAnime() {
  return (
    <section className="page-section space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-white glow-text">Add Anime</h1>
        <p className="text-sm text-purple-400/70">Add a new title to your watchlist with status, rating, notes, and cover image.</p>
      </header>
      <AnimeForm />
    </section>
  );
}
