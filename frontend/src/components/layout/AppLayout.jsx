import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Home, ClipboardList, Users, AlertCircle, Activity, LogOut, 
  HeartHandshake, Menu, X, MessageSquare, ChevronRight, Mic, Shield 
} from 'lucide-react';
import FloatingChatWidget from '../chat/FloatingChatWidget';
import NotificationDropdown from './NotificationDropdown';
import ProfileModal from '../profile/ProfileModal';
import JudgeTourBar from '../common/JudgeTourBar';
import ThemeSwitcher from '../common/ThemeSwitcher';
import LanguageSwitcher from '../common/LanguageSwitcher';
import VoiceModeModal from '../voice/VoiceModeModal';

const Sidebar = ({ isOpen, setIsOpen, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const victimLinks = [
    { to: '/dashboard', icon: Home, label: t('nav.dashboard', 'Dashboard') },
    { to: '/check-in', icon: ClipboardList, label: t('nav.checkin', 'Daily Check-In') },
    { to: '/chat', icon: MessageSquare, label: t('nav.chat', 'AI & Doctor Chat') },
  ];

  const counsellorLinks = [
    { to: '/cases', icon: Users, label: t('nav.cases', 'Clinical Cases') },
    { to: '/governance', icon: Shield, label: 'NHAA Governance' },
    { to: '/chat', icon: MessageSquare, label: t('nav.messages', 'Patient Messages') },
    { to: '/alerts', icon: AlertCircle, label: t('nav.alerts', 'Crisis Alerts') },
    { to: '/intervention', icon: Activity, label: t('nav.interventions', 'Intervention Pipeline') },
  ];

  const links = user?.role === 'victim' ? victimLinks : counsellorLinks;

  return (
    <>
      <div 
        className={`fixed inset-0 z-20 bg-slate-900/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOpen(false)} 
      />
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        
        {/* Clickable Sanjeevani Brand Logo - Navigates Home */}
        <button 
          onClick={() => navigate(user?.role === 'victim' ? '/dashboard' : '/cases')} 
          className="w-full flex items-center justify-start h-16 bg-slate-950 px-5 cursor-pointer hover:bg-slate-900 transition-colors group focus:outline-none text-left border-b border-slate-800/80"
          title="Return to Sanjeevani Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center mr-3 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-wide block leading-tight">
              {t('brand.name', 'Sanjeevani')}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
              संजीवनी EHR
            </span>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <link.icon className="w-5 h-5 mr-3 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Sidebar Profile Badge - Clickable to Open Profile Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button 
            type="button"
            onClick={onOpenProfile}
            className="flex items-center mb-3 px-3 py-2.5 w-full rounded-xl hover:bg-slate-800/90 transition-all text-left group cursor-pointer border border-slate-800 hover:border-slate-700 focus:outline-none"
            title="Inspect & Edit Demographics"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-200 font-bold mr-3 shrink-0 group-hover:bg-indigo-600/50 transition-colors">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
                {user?.name}
              </p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-slate-400 capitalize">{user?.role}</span>
                <span className="text-[10px] text-indigo-400 font-semibold flex items-center group-hover:text-indigo-300">
                  {t('nav.inspect', 'Inspect')} <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          </button>

          <button 
            onClick={handleLogout} 
            className="flex items-center w-full px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('nav.logout', 'Logout')}
          </button>
        </div>
      </aside>
    </>
  );
};

const Header = ({ toggleSidebar, onOpenProfile, onOpenVoiceMode }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center space-x-3">
        <button 
          onClick={toggleSidebar} 
          className="p-2 text-slate-500 lg:hidden hover:bg-slate-100 rounded-lg cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3 py-1.5 rounded-full border border-indigo-500/30 text-xs shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
          <span className="font-bold text-[11px] tracking-wide text-indigo-200">NHAA 14566</span>
          <span className="text-[10px] text-slate-300 hidden md:inline">&bull; National Atrocity Distress Portal</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        
        {/* Language Selector: 8 Indic Languages */}
        <LanguageSwitcher />

        {/* Theme Selector: Clinical Blue vs Midnight Black */}
        <ThemeSwitcher />

        {/* Live AI Voice Mode Button */}
        <button
          type="button"
          onClick={onOpenVoiceMode}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-105"
          title="Talk with Sanjeevani AI in Live Voice Mode"
        >
          <Mic className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">{t('header.voiceModeBtn', 'Voice Mode')}</span>
        </button>

        {/* Interactive Bell Icon Dropdown */}
        <NotificationDropdown />

        {/* Interactive Top Header Profile Pill */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center space-x-2.5 p-1.5 pl-3 rounded-full hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 group"
          title="Inspect & Edit Profile Demographics"
        >
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-400 capitalize -mt-0.5">
              {user?.role === 'victim' ? 'Patient' : 'Counsellor'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </button>
      </div>
    </header>
  );
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  return (
    <div className="min-h-screen app-bg bg-slate-50 flex">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header 
          toggleSidebar={() => setSidebarOpen(true)} 
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenVoiceMode={() => setIsVoiceModalOpen(true)}
        />
        <JudgeTourBar onOpenProfile={() => setIsProfileModalOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />

      {/* Global Profile & Demographics Inspector & Edit Modal */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* Global AI Voice Model Modal */}
      <VoiceModeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
