import { useEffect, useState } from 'react';
import { syncSetupUser } from './api/setupSync';
import KanbanBoard from './components/KanbanBoard';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import SetupOnboarding from './components/SetupOnboarding';
import SheetSettingsModal from './components/SheetSettingsModal';
import { AnimeProvider } from './context/AnimeContext';
import { DEFAULT_THEME, readStoredTheme, saveThemePreference } from './theme/themePreference';
import { normalizeSetupPayload } from './utils/constants';
import { clearStoredSetup, isSetupComplete, readStoredSetup, saveSetup } from './setup/setupStorage';

function App() {
  const [setup, setSetup] = useState(() => normalizeSetupPayload({}));
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupReady, setSetupReady] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => readStoredTheme());

  useEffect(() => {
    const storedSetup = readStoredSetup();
    if (storedSetup) {
      setSetup(storedSetup);
      setSetupComplete(isSetupComplete(storedSetup));
    }
    setSetupReady(true);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const normalizedTheme = theme || DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', normalizedTheme);
    document.documentElement.style.colorScheme = normalizedTheme;

    const root = document.getElementById('root');
    if (root) {
      root.setAttribute('data-theme', normalizedTheme);
    }
  }, [theme]);

  useEffect(() => {
    if (!setupReady || !setupComplete) return;

    syncSetupUser(setup).catch((error) => {
      console.warn('[SetupSync] Failed to queue setup_user sync.', error);
    });
  }, [setup, setupComplete, setupReady]);

  function handleSetupComplete(nextSetup) {
    const savedSetup = saveSetup(nextSetup);
    setSetup(savedSetup);
    setSetupComplete(isSetupComplete(savedSetup));
  }

  function handleSheetLinkSave(nextSheetUrl) {
    const savedSetup = saveSetup({ ...setup, sheetUrl: nextSheetUrl });
    setSetup(savedSetup);
    setSetupComplete(isSetupComplete(savedSetup));
  }

  function handleLogout() {
    clearStoredSetup();
    setSetup(normalizeSetupPayload({}));
    setSetupComplete(false);
    setIsSettingsOpen(false);
  }

  function handleThemeToggle() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      return saveThemePreference(nextTheme);
    });
  }

  return (
    <main
      className={`app-shell theme-${theme} h-auto overflow-auto md:h-screen md:overflow-hidden flex flex-col ${
        theme === 'light' ? 'text-slate-900' : 'text-gray-100'
      } bg-other`}
    >
      <Navbar
        theme={theme}
        onToggleTheme={handleThemeToggle}
        onLogout={handleLogout}
        onUpdateSheetLink={() => setIsSettingsOpen(true)}
        setupComplete={setupReady && setupComplete}
        username={setup.username}
      />
      <div className="md:flex-1 md:overflow-hidden mx-auto w-full max-w-7xl px-4 py-6">
        {!setupReady ? <Loader message="Loading setup..." /> : null}

        {setupReady && !setupComplete ? (
          <SetupOnboarding initialValues={setup} onComplete={handleSetupComplete} />
        ) : null}

        {setupReady && setupComplete ? (
          <>
            <AnimeProvider key={`${setup.userId || 'user'}:${setup.spreadsheetId || 'sheet'}`}>
              <KanbanBoard />
            </AnimeProvider>

            {isSettingsOpen ? (
              <SheetSettingsModal
                currentSheetUrl={setup.sheetUrl}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSheetLinkSave}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}

export default App;

