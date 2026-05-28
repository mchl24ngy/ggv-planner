import { LanguageProvider } from './i18n/LanguageContext';
import { useLanguage } from './i18n/useLanguage';
import { Configurator } from './components/Configurator';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const AppInner = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-100 px-4 md:px-8 py-4 md:py-6 font-sans">
      <div className="w-full mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'de' ? 'Mieterstrom' : 'Tenant Electricity'}{' '}
            <span className="text-blue-600">&</span> GGV Planner
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t.appSubtitle}</p>
        </div>

        {/* Open Source Info */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 bg-slate-800 text-white font-medium px-2.5 py-1 rounded-full">
            <GitHubIcon />
            {t.openSource}
          </span>
          <a
            href="https://github.com/michael2avori4energy/ggv-planner/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <GitHubIcon />
            {t.projectOnGithub}
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="https://schaeufler.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {t.myWebsite}
          </a>
        </div>

        {/* Language Switcher */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm flex-shrink-0">
          <button
            onClick={() => setLang('de')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              lang === 'de'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            DE
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              lang === 'en'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <Configurator />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
