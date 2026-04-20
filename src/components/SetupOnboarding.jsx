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
    languageLabel: 'Language',
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
    beforeSavingTitle: 'Before saving:',
    beforeSavingShare: 'Share your Google Sheet as "Anyone with the link" with edit access.',
    beforeSavingTabs: 'The app will use/create these tabs:',
    beforeSavingUrl: 'Paste the full sheet URL (template shown below) or spreadsheet ID.',
    templateTitle: 'Example/template URL',
    usernameRequired: 'Username is required.',
    passwordRequired: 'Password is required.',
    sheetUrlRequired: 'A valid Google Sheet link is required.',
    steps: {
      language: {
        badge: 'Language',
        title: 'Step 1: Choose your language',
        description: 'Pick your preferred app language for this device.',
      },
      credentials: {
        badge: 'Login',
        title: 'Step 1: Enter your account details',
        description: 'This login-style form keeps your username/password setup in one place.',
      },
      sheetLink: {
        badge: 'Sheet Link',
        title: 'Step 2: Connect your Google Sheet',
        description: 'Paste your spreadsheet URL so your watchlist can stay linked.',
      },
    },
  },
  bn: {
    welcomeTitle: 'Anime Watchlist-এ স্বাগতম',
    welcomeDescription: 'বোর্ড ব্যবহার শুরু করার জন্য এই প্রথমবারের সেটআপ সম্পন্ন করুন।',
    languageLabel: 'ভাষা',
    usernameLabel: 'ইউজারনেম',
    usernamePlaceholder: 'যেমন: salimuddin07',
    passwordLabel: 'পাসওয়ার্ড',
    passwordPlaceholder: 'আপনার পাসওয়ার্ড দিন',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    backButton: 'পেছনে',
    continueButton: 'পরবর্তী',
    saveButton: 'সেটআপ সেভ করে চালিয়ে যান',
    savingButton: 'সেভ হচ্ছে...',
    checkingUserMessage: 'এই অ্যাকাউন্টে আগে থেকেই শিট আছে কিনা দেখা হচ্ছে...',
    existingUserFoundMessage: 'অ্যাকাউন্ট পাওয়া গেছে এবং শিট সংযুক্ত আছে। সেটআপ সম্পন্ন করা হচ্ছে...',
    beforeSavingTitle: 'সেভ করার আগে:',
    beforeSavingShare: 'Google Sheet-টি "Anyone with the link" এবং edit access দিয়ে শেয়ার করুন।',
    beforeSavingTabs: 'অ্যাপ এই ট্যাবগুলো ব্যবহার/তৈরি করবে:',
    beforeSavingUrl: 'সম্পূর্ণ sheet URL (নিচে টেমপ্লেট আছে) অথবা spreadsheet ID দিন।',
    templateTitle: 'উদাহরণ/টেমপ্লেট URL',
    usernameRequired: 'ইউজারনেম আবশ্যক।',
    passwordRequired: 'পাসওয়ার্ড আবশ্যক।',
    sheetUrlRequired: 'সঠিক Google Sheet লিংক দিন।',
    steps: {
      language: {
        badge: 'ভাষা',
        title: 'ধাপ ১: আপনার ভাষা বেছে নিন',
        description: 'এই ডিভাইসের জন্য পছন্দের অ্যাপ ভাষা নির্বাচন করুন।',
      },
      credentials: {
        badge: 'লগইন',
        title: 'ধাপ ১: আপনার অ্যাকাউন্ট তথ্য দিন',
        description: 'এই login-style ফর্মে আপনার username/password রাখা হবে।',
      },
      sheetLink: {
        badge: 'শিট লিংক',
        title: 'ধাপ ২: আপনার Google Sheet সংযোগ করুন',
        description: 'আপনার spreadsheet URL দিন যাতে watchlist সংযুক্ত থাকে।',
      },
    },
  },
  hi: {
    welcomeTitle: 'Anime Watchlist में आपका स्वागत है',
    welcomeDescription: 'बोर्ड का उपयोग शुरू करने के लिए यह पहली बार वाला सेटअप पूरा करें।',
    languageLabel: 'भाषा',
    usernameLabel: 'यूज़रनेम',
    usernamePlaceholder: 'उदा.: salimuddin07',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    backButton: 'पीछे',
    continueButton: 'आगे बढ़ें',
    saveButton: 'सेटअप सेव करें और जारी रखें',
    savingButton: 'सेव हो रहा है...',
    checkingUserMessage: 'जांच हो रही है कि इस अकाउंट में पहले से सेव की हुई शीट है या नहीं...',
    existingUserFoundMessage: 'अकाउंट मिला और शीट जुड़ी हुई है। सेटअप पूरा किया जा रहा है...',
    beforeSavingTitle: 'सेव करने से पहले:',
    beforeSavingShare: 'Google Sheet को "Anyone with the link" और edit access के साथ शेयर करें।',
    beforeSavingTabs: 'ऐप इन टैब्स का उपयोग/निर्माण करेगा:',
    beforeSavingUrl: 'पूरा sheet URL (नीचे टेम्पलेट दिया है) या spreadsheet ID दर्ज करें।',
    templateTitle: 'उदाहरण/टेम्पलेट URL',
    usernameRequired: 'यूज़रनेम आवश्यक है।',
    passwordRequired: 'पासवर्ड आवश्यक है।',
    sheetUrlRequired: 'कृपया सही Google Sheet लिंक दर्ज करें।',
    steps: {
      language: {
        badge: 'भाषा',
        title: 'चरण 1: अपनी भाषा चुनें',
        description: 'इस डिवाइस के लिए अपनी पसंदीदा ऐप भाषा चुनें।',
      },
      credentials: {
        badge: 'लॉगिन',
        title: 'चरण 1: अपने अकाउंट की जानकारी दें',
        description: 'यह login-style फ़ॉर्म आपके username/password सेटअप को एक जगह रखता है।',
      },
      sheetLink: {
        badge: 'शीट लिंक',
        title: 'चरण 2: अपनी Google Sheet कनेक्ट करें',
        description: 'अपनी spreadsheet URL दें ताकि आपकी watchlist जुड़ी रहे।',
      },
    },
  },
  gu: {
    welcomeTitle: 'Anime Watchlist માં આપનું સ્વાગત છે',
    welcomeDescription: 'તમારો બોર્ડ ઉપયોગમાં લેવા માટે આ પ્રથમ સેટઅપ પૂર્ણ કરો.',
    languageLabel: 'ભાષા',
    usernameLabel: 'યુઝરનેમ',
    usernamePlaceholder: 'જેમ કે: salimuddin07',
    passwordLabel: 'પાસવર્ડ',
    passwordPlaceholder: 'તમારો પાસવર્ડ દાખલ કરો',
    sheetUrlLabel: 'Google Sheet URL',
    sheetUrlPlaceholder: 'https://docs.google.com/spreadsheets/d/...',
    backButton: 'પાછળ',
    continueButton: 'આગળ વધો',
    saveButton: 'સેટઅપ સેવ કરો અને આગળ વધો',
    savingButton: 'સેવ થઈ રહ્યું છે...',
    checkingUserMessage: 'આ એકાઉન્ટમાં પહેલેથી સેવ કરેલી શીટ છે કે નહીં તે તપાસી રહ્યા છીએ...',
    existingUserFoundMessage: 'એકાઉન્ટ મળી ગયું અને શીટ જોડાયેલ છે. સેટઅપ પૂર્ણ થઈ રહ્યું છે...',
    beforeSavingTitle: 'સેવ કરતા પહેલા:',
    beforeSavingShare: 'Google Sheet ને "Anyone with the link" અને edit access સાથે શેર કરો.',
    beforeSavingTabs: 'એપ આ ટેબ્સનો ઉપયોગ/બનાવશે:',
    beforeSavingUrl: 'પૂર્ણ sheet URL (નીચે ટેમ્પલેટ બતાવ્યું છે) અથવા spreadsheet ID દાખલ કરો.',
    templateTitle: 'ઉદાહરણ/ટેમ્પલેટ URL',
    usernameRequired: 'યુઝરનેમ જરૂરી છે.',
    passwordRequired: 'પાસવર્ડ જરૂરી છે.',
    sheetUrlRequired: 'કૃપા કરીને માન્ય Google Sheet લિંક દાખલ કરો.',
    steps: {
      language: {
        badge: 'ભાષા',
        title: 'પગલું 1: તમારી ભાષા પસંદ કરો',
        description: 'આ ડિવાઇસ માટે તમારી પસંદગીની એપ ભાષા પસંદ કરો.',
      },
      credentials: {
        badge: 'લોગિન',
        title: 'પગલું 1: તમારા એકાઉન્ટની વિગતો દાખલ કરો',
        description: 'આ login-style ફોર્મ તમારા username/password સેટઅપને એક જ જગ્યાએ રાખે છે.',
      },
      sheetLink: {
        badge: 'શીટ લિંક',
        title: 'પગલું 2: તમારી Google Sheet જોડો',
        description: 'તમારી spreadsheet URL દાખલ કરો જેથી તમારી watchlist જોડાયેલી રહે.',
      },
    },
  },
};

const TEMPLATE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit#gid=0';

function getCopy(language) {
  return COPY[language] || COPY.en;
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

async function findExistingUserSetup(username, password) {
  if (!SHEETS_SCRIPT_URL) return null;

  const cleanUsername = toCleanString(username);
  const cleanPassword = toCleanString(password);
  if (!cleanUsername || !cleanPassword) return null;

  let requestUrl = '';
  try {
    const url = new URL(SHEETS_SCRIPT_URL);
    url.searchParams.set('action', 'get_user');
    url.searchParams.set('username', cleanUsername);
    url.searchParams.set('password', cleanPassword);
    requestUrl = url.toString();
  } catch {
    return null;
  }

  try {
    const response = await fetch(requestUrl, { method: 'GET' });
    if (!response.ok) return null;

    const payload = await response.json();
    const user = payload?.user;
    if (!user) return null;

    const spreadsheetId = parseSpreadsheetId(user.spreadsheetId || user.sheetUrl);
    if (!spreadsheetId) return null;

    return {
      userId: toCleanString(user.userId),
      sheetUrl: toCleanString(user.sheetUrl),
      spreadsheetId,
      language: toCleanString(user.language).toLowerCase(),
    };
  } catch {
    return null;
  }
}

export default function SetupOnboarding({ initialValues, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState(() => toInitialForm(initialValues));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', tone: 'info' });
  const copy = getCopy(formData.language);

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
        const existingUser = await findExistingUserSetup(formData.username, formData.password);
        if (existingUser) {
          setStatusMessage({ text: copy.existingUserFoundMessage, tone: 'success' });
          const normalized = normalizeSetupPayload({
            ...formData,
            userId: existingUser.userId,
            sheetUrl: existingUser.sheetUrl || existingUser.spreadsheetId,
            spreadsheetId: existingUser.spreadsheetId,
            language: formData.language || existingUser.language || DEFAULT_LANGUAGE,
          });
          await new Promise((resolve) => {
            setTimeout(resolve, 300);
          });
          await Promise.resolve(onComplete?.(normalized));
          return;
        }
      } finally {
        setSubmitting(false);
      }

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
                  className={`${INPUT_CLASS} mt-1`}
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder={copy.usernamePlaceholder}
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
