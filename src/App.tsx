import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { RefreshCw, Users, Building2, Briefcase, Ticket, Settings as SettingsIcon } from 'lucide-react';
import { useSync } from './useSync';
import { ContactList } from './components/ContactList';
import { ContactForm } from './components/ContactForm';
import { CompanyList } from './components/CompanyList';
import { CompanyDetail } from './components/CompanyDetail';
import { DealList } from './components/DealList';
import { DealDetail } from './components/DealDetail';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { Settings } from './components/Settings';

import { I18nProvider, useTranslation } from './i18n';

import { SyncStatus } from './components/SyncStatus';

function NavItem({ to, icon: Icon, label, external }: { to: string; icon: any; label: string; external?: boolean }) {
  const location = useLocation();
  const isActive = !external && (location.pathname === to || location.pathname.startsWith(to + '/'));

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-blue-100 hover:bg-blue-800 hover:text-white"
      >
        <Icon size={20} />
        {label}
      </a>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
        ? 'bg-blue-800 text-white'
        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
        }`}
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { isOnline, isSyncing, queueLength } = useSync();
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 border-r border-blue-800 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
        <div className="flex items-center justify-center h-16 bg-blue-950 px-4">
          {/* Increased logo size to full width of container (minus padding) */}
          <img src="https://www.digitalisim.fr/hubfs/digitalisim_theme/images/Logo%20final-DIGITALISIM-FR-white.svg" alt="Digitalisim" className="w-full h-auto max-h-12 object-contain" />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/" icon={Users} label={t('nav.contacts')} />
          <NavItem to="/companies" icon={Building2} label={t('nav.companies')} />
          <NavItem to="/deals" icon={Briefcase} label={t('nav.deals')} />
          <NavItem to="/tickets" icon={Ticket} label={t('nav.tickets')} />

          <div className="pt-4 mt-4 border-t border-blue-800">
            <NavItem to="https://www.digitalisim.fr/contact" icon={Users} label={t('nav.contact_us')} external />
          </div>
        </nav>

        <div className="p-4 border-t border-blue-800 space-y-4">
          {/* Language Toggle */}
          <div className="flex bg-blue-800 rounded-md p-1">
            <button
              onClick={() => setLanguage('fr')}
              className={`flex-1 text-xs py-1 rounded ${language === 'fr' ? 'bg-white text-blue-900 font-medium' : 'text-blue-200 hover:text-white'}`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 text-xs py-1 rounded ${language === 'en' ? 'bg-white text-blue-900 font-medium' : 'text-blue-200 hover:text-white'}`}
            >
              EN
            </button>
          </div>

          <NavItem to="/settings" icon={SettingsIcon} label={t('nav.settings')} />

          <div className="flex items-center gap-2 text-sm text-blue-200 px-3">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span>{isOnline ? t('nav.online') : t('nav.offline')}</span>
          </div>

          <Link to="/sync-status" className="block">
            <div className="flex items-center gap-2 text-xs text-blue-300 px-3 hover:text-white transition-colors">
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? t('nav.syncing') : `${queueLength} ${t('nav.pending')}`}</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Header & Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 md:hidden">
          <div className="px-4 h-16 flex items-center justify-between">
            <span className="font-bold text-gray-900">DIGITALISIM</span>
            <Link to="/settings" className="p-2 text-gray-500">
              <SettingsIcon size={24} />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<ContactList />} />
            <Route path="/new" element={<ContactForm />} />
            <Route path="/edit/:id" element={<ContactForm />} />

            <Route path="/companies" element={<CompanyList />} />
            <Route path="/companies/:id" element={<CompanyDetail />} />

            <Route path="/deals" element={<DealList />} />
            <Route path="/deals/:id" element={<DealDetail />} />

            <Route path="/tickets" element={<TicketList />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/sync-status" element={<SyncStatus />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </I18nProvider>
  );
}

export default App;
