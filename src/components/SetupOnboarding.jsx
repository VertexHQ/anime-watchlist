import { useEffect, useMemo, useState } from 'react';
import {
  SHEETS_SCRIPT_URL,
  DEFAULT_LANGUAGE,
  REQUIRED_SHEET_TABS,
  SETUP_STEPS,
  normalizeSetupPayload,
  parseSpreadsheetId,
  validateSetupPayload,
} from '../utils/constants';

const INPUT_CLASS =
  'w-full rounded-md border border-purple-900/50 bg-black/60 px-3 py-2 text-white placeholder-gray-600 outline-none ring-purple-500/40 backdrop-blur-sm transition focus:border-purple-500 focus:ring-2';

const COPY = {
  en: {
    welcomeTitle: 'Welcome to Anime Watchlist',
    welcomeDescription: 'Complete this first-time setup to start using your board.',
    usernameLabel: 'Username',
    usernamePlaceholder: 'e.g. salimuddin07',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    backButton: 'Back',
    continueButton: 'Continue',
    saveButton: 'Save setup & continue',
    savingButton: 'Saving...',
    checkingUserMessage: 'Checking if this account already has a saved sheet...',
    existingUserFoundMessage: 'Account found with a saved sheet. Finishing setup now...',
    lookupErrorMessage: 'Could not connect to check your account. Please try again.',
    beforeSavingTitle: 'Before saving:',
    beforeSavingShare: 'Share your Google Sheet as "Anyone with the link" with edit access.',
    beforeSavingTabs: 'The app will use/create these tabs:',
    beforeSavingUrl: 'Paste the full sheet URL (template shown below) or spreadsheet ID.',
    templateTitle: 'Example/template URL',
    usernameRequired: 'Username is required.',
    passwordRequired: 'Password is required.',
    sheetUrlRequired: 'A valid Google Sheet link is required.',
    steps: {
      credentials: {
        badge: 'Login',
        title: 'Enter your account details',
        description: 'Enter your username and password to sign in or create a new setup.',
      },
      sheetLink: {
        badge: 'Sheet Link',
        title: 'Connect your Google Sheet',
        description: 'Paste your spreadsheet URL so your watchlist can stay linked.',
      },
    },
  },
};


const TEMPLATE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit#gid=0';

function getCopy() {
  return COPY.en;
}

function toInitialForm(initialValues) {
  const normalized = normalizeSetupPayload(initialValues || {});

  return {
    language: normalized.language || DEFAULT_LANGUAGE,
    username: normalized.username || '',
    password: normalized.password || '',
    sheetUrl: normalized.sheetUrl || '',
  };
}

function toCleanString(value) {
  return String(value ?? '').trim();
}

// Returns { status: 'found', data } | { status: 'not_found' } | { status: 'error' } | { status: 'no_sync' }
async function findExistingUserSetup(username, password) {
  if (!SHEETS_SCRIPT_URL) return { status: 'no_sync' };

  const cleanUsername = toCleanString(username);
  const cleanPassword = toCleanString(password);
  if (!cleanUsername || !cleanPassword) return { status: 'no_sync' };

  let requestUrl = '';
  try {
    const url = new URL(SHEETS_SCRIPT_URL);
    url.searchParams.set('action', 'get_user');
    url.searchParams.set('username', cleanUsername.toLowerCase());
    url.searchParams.set('password', cleanPassword);
    requestUrl = url.toString();
  } catch {
    return { status: 'error' };
  }

  try {
    const response = await fetch(requestUrl, { method: 'GET' });
    if (!response.ok) return { status: 'error' };

    const payload = await response.json();
    if (!payload.success) {
      return payload.code === 'NOT_FOUND'
        ? { status: 'not_found' }
        : { status: 'error' };
    }

    const user = payload?.user;
    if (!user) return { status: 'not_found' };

    const spreadsheetId = parseSpreadsheetId(user.spreadsheetId || user.sheetUrl);
    if (!spreadsheetId) return { status: 'not_found' };

    return {
      status: 'found',
      data: {
        userId: toCleanString(user.userId),
        sheetUrl: toCleanString(user.sheetUrl),
        spreadsheetId,
        language: toCleanString(user.language).toLowerCase(),
      },
    };
  } catch {
    return { status: 'error' };
  }
}

export default function SetupOnboarding({ initialValues, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(() => toInitialForm(initialValues));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', tone: 'info' });
  const copy = getCopy();

  useEffect(() => {
    const initialLanguage = normalizeSetupPayload(initialValues || {}).language || DEFAULT_LANGUAGE;
    setFormData((prev) => (
      prev.language === initialLanguage
        ? prev
        : { ...prev, language: initialLanguage }
    ));
  }, [initialValues?.language]);

  const steps = useMemo(
    () => [
      {
        id: SETUP_STEPS.CREDENTIALS,
        badge: copy.steps.credentials.badge,
        title: copy.steps.credentials.title,
        description: copy.steps.credentials.description,
      },
      {
        id: SETUP_STEPS.SHEET_LINK,
        badge: copy.steps.sheetLink.badge,
        title: copy.steps.sheetLink.title,
        description: copy.steps.sheetLink.description,
      },
    ],
    [copy],
  );

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStep.id === SETUP_STEPS.SHEET_LINK;

  const requiredTabsText = useMemo(
    () => [
      REQUIRED_SHEET_TABS.completed.label,
      REQUIRED_SHEET_TABS.watching.label,
      REQUIRED_SHEET_TABS.plan.label,
      REQUIRED_SHEET_TABS.upcoming.label,
    ].join(', '),
    [],
  );

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setStatusMessage({ text: '', tone: 'info' });
  }

  function validateCurrentStep() {
    if (currentStep.id === SETUP_STEPS.CREDENTIALS) {
      const stepErrors = {};
      if (!formData.username.trim()) {
        stepErrors.username = copy.usernameRequired;
      }
      if (!formData.password.trim()) {
        stepErrors.password = copy.passwordRequired;
      }
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return Object.keys(stepErrors).length === 0;
    }

    const validation = validateSetupPayload(formData);
    if (!validation.isValid) {
      const stepErrors = { ...validation.errors };
      if (stepErrors.sheetUrl) {
        stepErrors.sheetUrl = copy.sheetUrlRequired;
      }
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return false;
    }
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    if (currentStep.id === SETUP_STEPS.CREDENTIALS) {
      setSubmitting(true);
      setStatusMessage({ text: copy.checkingUserMessage, tone: 'info' });
      try {
        const result = await findExistingUserSetup(formData.username, formData.password);
        if (result.status === 'found') {
          setStatusMessage({ text: copy.existingUserFoundMessage, tone: 'success' });
          const normalized = normalizeSetupPayload({
            ...formData,
            userId: result.data.userId,
            sheetUrl: result.data.sheetUrl || result.data.spreadsheetId,
            spreadsheetId: result.data.spreadsheetId,
            language: formData.language || result.data.language || DEFAULT_LANGUAGE,
          });
          await new Promise((resolve) => {
            setTimeout(resolve, 300);
          });
          await Promise.resolve(onComplete?.(normalized));
          return;
        }
        if (result.status === 'error') {
          setStatusMessage({ text: copy.lookupErrorMessage, tone: 'error' });
          return;
        }
      } finally {
        setSubmitting(false);
      }

      // status === 'not_found' or 'no_sync': new user, proceed to Sheet URL step
      setStatusMessage({ text: '', tone: 'info' });
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }

    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }

    setSubmitting(true);
    try {
      const normalized = normalizeSetupPayload(formData);
      await Promise.resolve(onComplete?.(normalized));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <form
        className="dark-card flex w-full flex-col gap-5 border border-purple-500/40 bg-black/55"
        onSubmit={handleSubmit}
      >
        <div>
          <h1 className="text-2xl font-bold text-white glow-text">{copy.welcomeTitle}</h1>
          <p className="mt-1 text-sm text-purple-200/80">
            {copy.welcomeDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep.id;
            const isDone = index < currentStepIndex;
            return (
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  isActive
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                    : isDone
                      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                      : 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                }`}
                key={step.id}
              >
                {index + 1}. {step.badge}
              </span>
            );
          })}
        </div>

        <div className="rounded-lg border border-purple-500/25 bg-black/40 p-4">
          <h2 className="text-lg font-semibold text-white">{currentStep.title}</h2>
          <p className="mt-1 text-sm text-purple-200/80">{currentStep.description}</p>

          {statusMessage.text ? (
            <div
              className={`mt-3 rounded-md border p-3 text-sm ${
                statusMessage.tone === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                  : statusMessage.tone === 'error'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-100'
                    : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100'
              }`}
            >
              {statusMessage.text}
            </div>
          ) : null}

          {currentStep.id === SETUP_STEPS.CREDENTIALS ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-purple-200/90">
                {copy.usernameLabel}
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  className={`${INPUT_CLASS} mt-1`}
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder={copy.usernamePlaceholder}
                  spellCheck={false}
                  type="text"
                  value={formData.username}
                />
                {errors.username ? (
                  <span className="mt-1 block text-xs text-rose-300">{errors.username}</span>
                ) : null}
              </label>

              <label className="text-sm text-purple-200/90">
                {copy.passwordLabel}
                <input
                  className={`${INPUT_CLASS} mt-1`}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  type="password"
                  value={formData.password}
                />
                {errors.password ? (
                  <span className="mt-1 block text-xs text-rose-300">{errors.password}</span>
                ) : null}
              </label>
            </div>
          ) : null}

          {currentStep.id === SETUP_STEPS.SHEET_LINK ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-md border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                <p className="font-medium">{copy.beforeSavingTitle}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>{copy.beforeSavingShare}</li>
                  <li>{copy.beforeSavingTabs} {requiredTabsText}.</li>
                  <li>{copy.beforeSavingUrl}</li>
                </ul>
              </div>

              <label className="block text-sm text-purple-200/90">
                {copy.sheetUrlLabel}
                <input
                  className={`${INPUT_CLASS} mt-1`}
                  onChange={(event) => updateField('sheetUrl', event.target.value)}
                  placeholder={copy.sheetUrlPlaceholder}
                  type="text"
                  value={formData.sheetUrl}
                />
                {errors.sheetUrl ? (
                  <span className="mt-1 block text-xs text-rose-300">{errors.sheetUrl}</span>
                ) : null}
              </label>

              <div className="rounded-md border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-100">
                <p className="font-medium text-purple-200">{copy.templateTitle}</p>
                <p className="mt-1 break-all font-mono">{TEMPLATE_SHEET_URL}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="rounded-md border border-purple-500/40 bg-purple-900/30 px-4 py-2 text-sm text-purple-200 transition hover:border-purple-400 hover:bg-purple-800/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={currentStepIndex === 0 || submitting}
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            type="button"
          >
            {copy.backButton}
          </button>

          <button
            className="rounded-md bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(139,92,246,0.45)] transition hover:bg-purple-500 hover:shadow-[0_0_26px_rgba(139,92,246,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {isLastStep
              ? (submitting ? copy.savingButton : copy.saveButton)
              : copy.continueButton}
          </button>
        </div>
      </form>
    </section>
  );
}
