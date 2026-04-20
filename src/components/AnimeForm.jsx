import { useState } from 'react';
import { useAnime } from '../hooks/useAnime';
import { ANIME_STATUSES } from '../utils/constants';

const INITIAL_FORM = {
  title: '',
  status: ANIME_STATUSES.WATCHING,
  rating: '',
  notes: '',
  image: '',
};

const inputClass =
  'rounded-md border border-purple-900/50 bg-black/60 px-3 py-2 text-white placeholder-gray-600 outline-none ring-purple-500/40 backdrop-blur-sm transition focus:border-purple-500 focus:ring-2';

export default function AnimeForm({ initialData = null, onSuccess }) {
  const isEdit = Boolean(initialData);
  const [formData, setFormData] = useState(
    isEdit
      ? {
          title: initialData.title ?? '',
          status: initialData.status ?? ANIME_STATUSES.WATCHING,
          rating: initialData.rating ?? '',
          notes: initialData.notes ?? '',
          image: initialData.image ?? '',
        }
      : INITIAL_FORM,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const { addAnimeEntry, updateAnimeEntry, anime } = useAnime();

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    const payload = {
      title: formData.title.trim(),
      status: formData.status,
      rating: formData.rating,
      notes: formData.notes.trim(),
      image: formData.image.trim(),
    };

    try {
      if (isEdit) {
        await updateAnimeEntry(initialData.id, payload);
        setSubmitSuccess('Anime updated successfully.');
      } else {
        const duplicate = anime.find(
          (a) =>
            a.title.trim().toLowerCase() === payload.title.toLowerCase() &&
            a.status === payload.status,
        );
        if (duplicate) {
          setSubmitError(`"${payload.title}" already exists in your ${payload.status} list.`);
          setSubmitting(false);
          return;
        }
        await addAnimeEntry(payload);
        setFormData(INITIAL_FORM);
        setSubmitSuccess('Anime added to your watchlist.');
      }
      onSuccess?.();
    } catch (err) {
      setSubmitError(err?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="dark-card mx-auto flex w-full max-w-3xl flex-col gap-5" onSubmit={handleSubmit}>
      <h2 className="text-xl font-semibold text-white glow-text">
        {isEdit ? 'Edit anime' : 'Add anime'}
      </h2>

      <label className="flex flex-col gap-1.5 text-sm text-purple-200/80">
        Title
        <input
          className={inputClass}
          name="title"
          onChange={handleChange}
          placeholder="e.g. Frieren: Beyond Journey's End"
          required
          value={formData.title}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-purple-200/80">
          Status
          <select
            className={inputClass}
            name="status"
            onChange={handleChange}
            value={formData.status}
          >
            <option value={ANIME_STATUSES.WATCHING}>Watching</option>
            <option value={ANIME_STATUSES.COMPLETED}>Completed</option>
            <option value={ANIME_STATUSES.PLANNED}>Plan to Watch</option>
            <option value={ANIME_STATUSES.UPCOMING}>Upcoming</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-purple-200/80">
          Rating
          <input
            className={inputClass}
            max="10"
            min="0"
            name="rating"
            onChange={handleChange}
            placeholder="0 – 10"
            step="0.1"
            type="number"
            value={formData.rating}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-purple-200/80">
        Cover Image URL
        <input
          className={inputClass}
          name="image"
          onChange={handleChange}
          placeholder="https://..."
          type="url"
          value={formData.image}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-purple-200/80">
        Notes
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          name="notes"
          onChange={handleChange}
          placeholder="Any thoughts about this anime..."
          value={formData.notes}
        />
      </label>

      {submitError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {submitError}
        </p>
      ) : null}
      {submitSuccess ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {submitSuccess}
        </p>
      ) : null}

      <button
        className="w-fit rounded-md bg-purple-600 px-6 py-2 font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] transition hover:bg-purple-500 hover:shadow-[0_0_24px_rgba(139,92,246,0.6)] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add to watchlist'}
      </button>
    </form>
  );
}
