import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Share2,
  Heart,
  Sliders,
  Baby,
  Layers,
  HelpCircle,
  Play,
  Terminal,
  Clock,
  LogOut,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { BabyProfile, VideoConfig } from './types';
import { DEFAULT_PROFILE, DEFAULT_BABY_VOICE, PRESET_PROFILES } from './data/samplePresets';
import { VideoPlayer } from './components/VideoPlayer';
import { EditorDrawer } from './components/EditorDrawer';
import { VideoExporter } from './components/VideoExporter';
import { TerminalLoginGate } from './components/TerminalLoginGate';
import { TerminalHeaderBadge } from './components/TerminalHeaderBadge';
import { TerminalStatusModal } from './components/TerminalStatusModal';
import {
  getActiveSession,
  setActiveSession,
  TerminalSession,
} from './utils/terminalAuth';
import { StudioLogo } from './components/StudioLogo';

export default function App() {
  // Terminal Authentication & 30-day session
  const [session, setSession] = useState<TerminalSession | null>(() => getActiveSession());
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);

  const [profile, setProfile] = useState<BabyProfile>(() => {
    const saved = localStorage.getItem('birthday_profile_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.babyVoice) {
          parsed.babyVoice = DEFAULT_BABY_VOICE;
        } else {
          parsed.babyVoice.showCaptionsOnVideo = false;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [config, setConfig] = useState<VideoConfig>(() => ({
    aspectRatio: '9:16',
    fps: 30,
    musicTheme: 'fairytale_box',
    soundEffects: true,
    sparkleIntensity: 65,
    showWatermark: false,
    babyVoice: profile.babyVoice || DEFAULT_BABY_VOICE,
  }));

  const [isExporterOpen, setIsExporterOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'scenes'>('editor');
  const [userUploadedImg, setUserUploadedImg] = useState<HTMLImageElement | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('birthday_profile_data', JSON.stringify(profile));
  }, [profile]);

  // Load custom photo if present
  useEffect(() => {
    if (profile.photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setUserUploadedImg(img);
      img.src = profile.photoUrl;
    } else {
      setUserUploadedImg(null);
    }
  }, [profile.photoUrl]);

  const handleChangeProfile = (updates: Partial<BabyProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const handleChangeConfig = (updates: Partial<VideoConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleLoginSuccess = (newSession: TerminalSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setActiveSession(null);
    setSession(null);
    setIsStatusModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-pink-500 selection:text-white pb-12">
      {/* If no active session, show the Terminal Login Gate requiring Terminal ID */}
      {!session && (
        <TerminalLoginGate onLoginSuccess={handleLoginSuccess} />
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/80 backdrop-blur-md border-b border-stone-800/80 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3 min-w-0">
            <StudioLogo size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  PixelBridge
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Studio 3D
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden lg:block truncate">
                Professional 3D video animator, invitations & motion clips
              </p>
            </div>
          </div>

          {/* Terminal ID & Live Countdown Timer + Export */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {session ? (
              <TerminalHeaderBadge
                session={session}
                onClick={() => setIsStatusModalOpen(true)}
              />
            ) : (
              <button
                onClick={() => setSession(getActiveSession())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 border border-blue-500/50 text-blue-300 text-xs font-semibold cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>PixelBridge Login</span>
              </button>
            )}

            {/* Google Sheets Quick Access Button */}
            <button
              id="header-sheets-btn"
              onClick={() => {
                const el = document.getElementById('tab-google-sheets');
                if (el) {
                  el.click();
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
              title="Open Google Sheets Guest & RSVP Tracker"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheets</span>
            </button>

            {/* Quick Header Export CTA in Single-Color Blue Theme */}
            <button
              id="header-export-btn"
              onClick={() => setIsExporterOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Clips</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-5 flex flex-col gap-6">
        {/* Terminal License Status Banner in Blue Theme */}
        {session && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-xs">
            <div className="flex items-center gap-2 text-stone-200">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping flex-shrink-0" />
              <span>
                <strong className="text-blue-400 font-semibold">PixelBridge Active</strong> | Account: <span className="text-white font-mono">{session.email}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="text-[11px] text-pink-300 hover:text-pink-200 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Clock className="w-3 h-3 text-amber-400" />
                <span>License Status & Timer</span>
              </button>
              <span className="text-stone-600 hidden sm:inline">•</span>
              <button
                onClick={handleLogout}
                className="text-[11px] text-stone-400 hover:text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch / Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Feature Notice Banner */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border text-xs ${
          profile.themeId === 'jungle_safari'
            ? 'bg-gradient-to-r from-emerald-950/60 via-stone-900 to-amber-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-stone-900 border border-pink-500/20 text-pink-200'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 animate-pulse" />
            <span>
              Now editing: <strong className="text-white font-bold">{profile.name || 'Baby'}</strong> turning 1!{' '}
              {profile.themeId === 'jungle_safari'
                ? `🌿 3D Jungle Safari (${profile.gender === 'boy' ? 'Boy Preset: Leo' : 'Girl Preset: Aneira'}): Safari jeep, jumping lion cub & animal party.`
                : 'Real-time 3D camera pan, floral train carriages & music box audio.'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-300 text-[11px] flex-wrap">
            <span className="text-stone-400 font-semibold mr-0.5">Quick Presets:</span>
            <button
              onClick={() => handleChangeProfile(PRESET_PROFILES.jungle_boy)}
              className={`px-2 py-0.5 rounded-md border text-[11px] cursor-pointer transition-all ${
                profile.themeId === 'jungle_safari' && profile.gender === 'boy'
                  ? 'bg-amber-500/30 border-amber-400 text-white font-bold'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              🦁 Leo (Jungle 3D)
            </button>
            <button
              onClick={() => handleChangeProfile(PRESET_PROFILES.jungle_girl)}
              className={`px-2 py-0.5 rounded-md border text-[11px] cursor-pointer transition-all ${
                profile.themeId === 'jungle_safari' && profile.gender === 'girl'
                  ? 'bg-emerald-500/30 border-emerald-400 text-white font-bold'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              🌿 Aneira (Jungle 3D)
            </button>
            <button
              onClick={() => handleChangeProfile(PRESET_PROFILES.noah_space)}
              className={`px-2 py-0.5 rounded-md border text-[11px] cursor-pointer transition-all ${
                profile.themeId === 'cosmic_space' && profile.gender === 'boy'
                  ? 'bg-indigo-500/30 border-indigo-400 text-white font-bold'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              🚀 Noah (Space)
            </button>
            <button
              onClick={() => handleChangeProfile(PRESET_PROFILES.seraphina_unicorn)}
              className={`px-2 py-0.5 rounded-md border text-[11px] cursor-pointer transition-all ${
                profile.themeId === 'unicorn_rainbow'
                  ? 'bg-fuchsia-500/30 border-fuchsia-400 text-white font-bold'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              🦄 Seraphina (Unicorn)
            </button>
            <button
              onClick={() => handleChangeProfile(PRESET_PROFILES.kai_ocean)}
              className={`px-2 py-0.5 rounded-md border text-[11px] cursor-pointer transition-all ${
                profile.themeId === 'under_sea' && profile.gender === 'boy'
                  ? 'bg-cyan-500/30 border-cyan-400 text-white font-bold'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              🌊 Kai (Ocean)
            </button>
            <button
              onClick={() => handleChangeProfile(PRESET_PROFILES.ethan_racing)}
              className={`px-2 py-0.5 rounded-md border text-[11px] cursor-pointer transition-all ${
                profile.themeId === 'racing_champion'
                  ? 'bg-red-500/30 border-red-400 text-white font-bold'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
            >
              🏎️ Ethan (Racer)
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('tab-child-details');
                if (el) {
                  el.click();
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 text-[11px] cursor-pointer font-semibold"
            >
              + 7 More
            </button>
            <span className="text-stone-500 hidden md:inline">•</span>
            <span className="hidden md:inline">{profile.themeId === 'jungle_safari' ? '✨ 37s HD Video' : '✨ 38s 3D Motion'}</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">📱 9:16 Reel</span>
          </div>
        </div>

        {/* Video Player Section */}
        {session && (
          <section className="w-full">
            <VideoPlayer
              profile={profile}
              config={config}
              onChangeConfig={handleChangeConfig}
              onOpenExporter={() => setIsExporterOpen(true)}
            />
          </section>
        )}

        {/* Customization Drawer Section */}
        <section className="w-full max-w-4xl mx-auto">
          <EditorDrawer
            profile={profile}
            config={config}
            onChangeProfile={handleChangeProfile}
            onChangeConfig={handleChangeConfig}
            onOpenExporter={() => setIsExporterOpen(true)}
          />
        </section>
      </main>

      {/* Terminal Account & 30-Day License Modal */}
      {session && (
        <TerminalStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          session={session}
          onLogout={handleLogout}
        />
      )}

      {/* Exporter Modal */}
      <VideoExporter
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        profile={profile}
        config={config}
        customUploadedImage={userUploadedImg}
      />
    </div>
  );
}

