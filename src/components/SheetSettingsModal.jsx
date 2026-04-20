import { useEffect, useMemo, useState } from 'react';
import { REQUIRED_SHEET_TABS, parseSpreadsheetId } from '../utils/constants';

const INPUT_CLASS =
  'w-full rounded-md border border-purple-900/50 bg-black/60 px-3 py-2 text-white placeholder-gray-600 outline-none ring-purple-500/40 backdrop-blur-sm transition focus:border-purple-500 focus:ring-2';

const COPY = {
  en: {
    title: 'Update Google Sheet Link',
    subtitle: 'Make sure the sheet is shared as "Anyone with the link" and can edit.',
    tabsLabel: 'App tabs used/created:',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    invalidSheet: 'Please enter a valid Google Sheet URL or spreadsheet ID.',
    cancel: 'Cancel',
    save: 'Save link',
    saving: 'Saving...',
  },
  bn: {
    title: 'Google Sheet Link আপডেট করুন',
    subtitle: 'শিটটি "Anyone with the link" এবং edit permission সহ শেয়ার করা আছে কিনা নিশ্চিত করুন।',
    tabsLabel: 'অ্যাপে ব্যবহৃত/তৈরি হওয়া ট্যাব:',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    invalidSheet: 'সঠিক Google Sheet URL বা spreadsheet ID দিন।',
    cancel: 'বাতিল',
    save: 'লিংক সেভ করুন',
    saving: 'সেভ হচ্ছে...',
  },
  hi: {
    title: 'Google Sheet लिंक अपडेट करें',
    subtitle: 'सुनिश्चित करें कि शीट "Anyone with the link" और edit अनुमति के साथ शेयर है।',
    tabsLabel: 'ऐप द्वारा उपयोग/बनाए जाने वाले टैब:',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    invalidSheet: 'कृपया सही Google Sheet URL या spreadsheet ID दर्ज करें।',
    cancel: 'रद्द करें',
    save: 'लिंक सेव करें',
    saving: 'सेव हो रहा है...',
  },
  gu: {
    title: 'Google Sheet લિંક અપડેટ કરો',
    subtitle: 'ખાતરી કરો કે શીટ "Anyone with the link" અને edit permission સાથે શેર છે.',
    tabsLabel: 'એપ દ્વારા ઉપયોગ/તૈયાર થતા ટેબ:',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    invalidSheet: 'કૃપા કરીને માન્ય Google Sheet URL અથવા spreadsheet ID દાખલ કરો.',
    cancel: 'રદ કરો',
    save: 'લિંક સેવ કરો',
    saving: 'સેવ થઈ રહ્યું છે...',
  },
};

export default function SheetSettingsModal({ currentSheetUrl = '', language = 'en', onClose, onSave }) {
  const [sheetUrl, setSheetUrl] = useState(currentSheetUrl);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const copy = COPY[language] || COPY.en;

  const requiredTabsText = useMemo(
    () => [
      REQUIRED_SHEET_TABS.completed.label,
      REQUIRED_SHEET_TABS.watching.label,
      REQUIRED_SHEET_TABS.plan.label,
      REQUIRED_SHEET_TABS.upcoming.label,
    ].join(', '),
    [],
  );

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!parseSpreadsheetId(sheetUrl)) {
      setError(copy.invalidSheet);
      return;
    }

    setSaving(true);
    try {
      await Promise.resolve(onSave?.(sheetUrl));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="w-full max-w-xl rounded-xl border border-purple-500/40 bg-[#070512]/95 p-5 shadow-[0_0_35px_rgba(139,92,246,0.18)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white glow-text">{copy.title}</h2>
            <p className="mt-1 text-sm text-purple-200/80">{copy.subtitle}</p>
          </div>
          <button
            className="rounded-md border border-purple-500/40 px-2 py-1 text-sm text-purple-200 transition hover:border-purple-400 hover:text-white"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-md border border-cyan-500/25 bg-cyan-500/10 p-3 text-xs text-cyan-100">
          {copy.tabsLabel} {requiredTabsText}
        </div>

        <label className="mt-4 block text-sm text-purple-200/90">
          {copy.sheetUrlLabel}
          <input
            className={`${INPUT_CLASS} mt-1`}
            onChange={(event) => {
              setSheetUrl(event.target.value);
              setError('');
            }}
            placeholder={copy.sheetUrlPlaceholder}
            type="text"
            value={sheetUrl}
          />
        </label>

        {error ? (
          <p className="mt-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-md border border-purple-500/40 px-4 py-2 text-sm text-purple-200 transition hover:border-purple-400 hover:text-white"
            onClick={onClose}
            type="button"
          >
            {copy.cancel}
          </button>
          <button
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? copy.saving : copy.save}
          </button>
        </div>
      </form>
    </div>
  );
}
