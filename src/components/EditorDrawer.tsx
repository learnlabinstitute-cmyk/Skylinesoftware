import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  Baby,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Wand2,
  Trash2,
  Mic,
  Sliders,
  Palette,
  FileSpreadsheet,
} from 'lucide-react';
import { BabyProfile, VideoConfig } from '../types';
import { PRESET_PROFILES, THEMES_METADATA } from '../data/samplePresets';
import { BabyVoiceGenerator } from './BabyVoiceGenerator';
import { GoogleSheetsManager } from './GoogleSheetsManager';

interface EditorDrawerProps {
  profile: BabyProfile;
  config: VideoConfig;
  onChangeProfile: (updates: Partial<BabyProfile>) => void;
  onChangeConfig: (updates: Partial<VideoConfig>) => void;
  onOpenExporter?: () => void;
}

export const EditorDrawer: React.FC<EditorDrawerProps> = ({
  profile,
  config,
  onChangeProfile,
  onChangeConfig,
  onOpenExporter,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'voice' | 'details' | 'venue' | 'visuals' | 'sheets'>('voice');
  const [presetFilter, setPresetFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [isGeneratingVerse, setIsGeneratingVerse] = useState<boolean>(false);
  const [aiVerseMessage, setAiVerseMessage] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChangeProfile({ photoUrl: dataUrl, avatarMode: 'photo_frame' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChangeProfile({ photoUrl: null, avatarMode: '3d_doll' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateVerse = async () => {
    setIsGeneratingVerse(true);
    setAiVerseMessage(null);
    try {
      const res = await fetch('/api/gemini/generate-verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          theme: profile.themeId,
        }),
      });
      const data = await res.json();
      if (data.verse) {
        onChangeProfile({
          customVerse: data.verse,
          invitationNote: data.subline || profile.invitationNote,
        });
        setAiVerseMessage('✨ AI Verse applied to celebration invitation!');
        setTimeout(() => setAiVerseMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      onChangeProfile({
        customVerse: `All aboard the celebration express! Sweet dreams and giggles we confess, as our precious ${profile.name || 'star'} turns ONE today!`,
      });
    } finally {
      setIsGeneratingVerse(false);
    }
  };

  const handleSelectPreset = (key: string) => {
    const preset = PRESET_PROFILES[key];
    if (preset) {
      onChangeProfile({ ...preset });
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Tab Navigation Navigation Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-900/90 backdrop-blur-xl rounded-2xl border border-stone-800 shadow-xl overflow-x-auto scrollbar-none">
        <button
          id="tab-baby-voice-generator"
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'voice'
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-pink-500/25 scale-[1.02]'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>🎙️ Baby Voice Generator</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/30 text-amber-200 uppercase tracking-wider font-extrabold">
            Featured
          </span>
        </button>

        <button
          id="tab-child-details"
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'details'
              ? 'bg-pink-500/25 text-pink-200 border border-pink-500/50 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Baby className="w-4 h-4 text-pink-400" />
          <span>Baby Photo & Star</span>
        </button>

        <button
          id="tab-event-venue"
          type="button"
          onClick={() => setActiveTab('venue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'venue'
              ? 'bg-pink-500/25 text-pink-200 border border-pink-500/50 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Date, Time & Venue</span>
        </button>

        <button
          id="tab-visual-effects"
          type="button"
          onClick={() => setActiveTab('visuals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'visuals'
              ? 'bg-pink-500/25 text-pink-200 border border-pink-500/50 shadow-md'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Sparkles & Rhyme</span>
        </button>

        <button
          id="tab-google-sheets"
          type="button"
          onClick={() => setActiveTab('sheets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'sheets'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>📊 Google Sheets & RSVPs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
            Drive
          </span>
        </button>
      </div>

      {/* Tab 1: Dedicated Baby Voice Generator */}
      {activeTab === 'voice' && (
        <BabyVoiceGenerator
          profile={profile}
          config={config}
          onChangeProfile={onChangeProfile}
          onChangeConfig={onChangeConfig}
          onOpenExporter={onOpenExporter}
        />
      )}

      {/* Tab 2: Child Details & Photo */}
      {activeTab === 'details' && (
        <div className="flex flex-col gap-6 bg-stone-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>Birthday Star & Photo</span>
              </h3>
              <p className="text-xs text-stone-400">
                Personalize the name, age, and attach a picture of your child for the 3D animated floral frame.
              </p>
            </div>

            {/* Quick Sample Presets with Filter Tabs */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  Select Video Preset:
                </span>
                <div className="flex items-center gap-1 bg-stone-950/60 p-0.5 rounded-lg border border-stone-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPresetFilter('all')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      presetFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    All (13)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFilter('boy')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      presetFilter === 'boy'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    👦 Boys (6)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetFilter('girl')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      presetFilter === 'girl'
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    👧 Girls (7)
                  </button>
                </div>
              </div>

              {/* Scrollable preset pills */}
              <div className="flex items-center gap-1.5 flex-wrap max-h-36 overflow-y-auto pr-1">
                {/* Boys Presets */}
                {(presetFilter === 'all' || presetFilter === 'boy') && (
                  <>
                    <button
                      id="preset-jungle-boy-btn"
                      type="button"
                      onClick={() => handleSelectPreset('jungle_boy')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'jungle_safari' && profile.gender === 'boy'
                          ? 'bg-amber-500/25 text-amber-200 border-amber-500/80 font-bold shadow-md shadow-amber-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🦁 Leo (Jungle 3D)</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-extrabold uppercase">3D Video</span>
                    </button>

                    <button
                      id="preset-noah-space-btn"
                      type="button"
                      onClick={() => handleSelectPreset('noah_space')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'cosmic_space' && profile.gender === 'boy'
                          ? 'bg-indigo-500/25 text-indigo-200 border-indigo-500/80 font-bold shadow-md shadow-indigo-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🚀 Noah (Cosmic Space)</span>
                    </button>

                    <button
                      id="preset-liam-btn"
                      type="button"
                      onClick={() => handleSelectPreset('liam')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'royal_blue'
                          ? 'bg-blue-500/25 text-blue-200 border-blue-500/80 font-bold shadow-md shadow-blue-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>👑 Liam (Royal Express)</span>
                    </button>

                    <button
                      id="preset-kai-ocean-btn"
                      type="button"
                      onClick={() => handleSelectPreset('kai_ocean')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'under_sea' && profile.gender === 'boy'
                          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/80 font-bold shadow-md shadow-cyan-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🌊 Kai (Ocean Reef)</span>
                    </button>

                    <button
                      id="preset-oliver-teddy-btn"
                      type="button"
                      onClick={() => handleSelectPreset('oliver_teddy')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'teddy_clouds' && profile.gender === 'boy'
                          ? 'bg-sky-500/25 text-sky-200 border-sky-500/80 font-bold shadow-md shadow-sky-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>☁️ Oliver (Teddy Balloon)</span>
                    </button>

                    <button
                      id="preset-ethan-racing-btn"
                      type="button"
                      onClick={() => handleSelectPreset('ethan_racing')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'racing_champion'
                          ? 'bg-red-500/25 text-red-200 border-red-500/80 font-bold shadow-md shadow-red-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🏎️ Ethan (Grand Prix Racer)</span>
                    </button>
                  </>
                )}

                {/* Girls Presets */}
                {(presetFilter === 'all' || presetFilter === 'girl') && (
                  <>
                    <button
                      id="preset-jungle-girl-btn"
                      type="button"
                      onClick={() => handleSelectPreset('jungle_girl')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'jungle_safari' && profile.gender === 'girl'
                          ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/80 font-bold shadow-md shadow-emerald-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🌿 Aneira (Jungle 3D)</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">3D Video</span>
                    </button>

                    <button
                      id="preset-kiara-btn"
                      type="button"
                      onClick={() => handleSelectPreset('kiara')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'fairytale_pink'
                          ? 'bg-pink-500/25 text-pink-200 border-pink-500/80 font-bold shadow-md shadow-pink-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🌸 Kiara (Princess Train)</span>
                    </button>

                    <button
                      id="preset-seraphina-unicorn-btn"
                      type="button"
                      onClick={() => handleSelectPreset('seraphina_unicorn')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'unicorn_rainbow'
                          ? 'bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-500/80 font-bold shadow-md shadow-fuchsia-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🦄 Seraphina (Unicorn Rainbow)</span>
                    </button>

                    <button
                      id="preset-marina-ocean-btn"
                      type="button"
                      onClick={() => handleSelectPreset('marina_ocean')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'under_sea' && profile.gender === 'girl'
                          ? 'bg-cyan-500/25 text-cyan-200 border-cyan-500/80 font-bold shadow-md shadow-cyan-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🧜‍♀️ Marina (Mermaid Lagoon)</span>
                    </button>

                    <button
                      id="preset-mia-teddy-btn"
                      type="button"
                      onClick={() => handleSelectPreset('mia_teddy')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'teddy_clouds' && profile.gender === 'girl'
                          ? 'bg-rose-500/25 text-rose-200 border-rose-500/80 font-bold shadow-md shadow-rose-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>☁️ Mia (Blush Clouds Teddy)</span>
                    </button>

                    <button
                      id="preset-stella-space-btn"
                      type="button"
                      onClick={() => handleSelectPreset('stella_space')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'cosmic_space' && profile.gender === 'girl'
                          ? 'bg-purple-500/25 text-purple-200 border-purple-500/80 font-bold shadow-md shadow-purple-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>✨ Stella (Starlight Space)</span>
                    </button>

                    <button
                      id="preset-aria-btn"
                      type="button"
                      onClick={() => handleSelectPreset('aria')}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        profile.themeId === 'mint_safari'
                          ? 'bg-teal-500/25 text-teal-200 border-teal-500/80 font-bold shadow-md shadow-teal-500/10'
                          : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-700/60'
                      }`}
                    >
                      <span>🍃 Aria (Mint Garden)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Child Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="child-name-input" className="text-xs font-semibold text-stone-300">
                Child's First Name
              </label>
              <input
                id="child-name-input"
                type="text"
                value={profile.name}
                onChange={(e) => onChangeProfile({ name: e.target.value })}
                placeholder="e.g. Aneira or Leo"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white placeholder-stone-500 transition-all"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="child-age-input" className="text-xs font-semibold text-stone-300">
                  Turning Age
                </label>
                <input
                  id="child-age-input"
                  type="number"
                  min="1"
                  max="10"
                  value={profile.age}
                  onChange={(e) => onChangeProfile({ age: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm text-white transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-300">Gender</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (profile.themeId === 'jungle_safari') {
                        onChangeProfile({
                          gender: 'girl',
                          name: profile.name === 'Leo' ? 'Aneira' : profile.name,
                          videoSource: '/assets/jungle_safari_video.mp4',
                        });
                      } else {
                        onChangeProfile({ gender: 'girl', themeId: 'fairytale_pink' });
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      profile.gender === 'girl'
                        ? 'bg-pink-500/25 border-pink-500 text-pink-200'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400'
                    }`}
                  >
                    👧 Girl
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (profile.themeId === 'jungle_safari') {
                        onChangeProfile({
                          gender: 'boy',
                          name: profile.name === 'Aneira' ? 'Leo' : profile.name,
                          videoSource: '/assets/jungle_safari_video.mp4',
                        });
                      } else {
                        onChangeProfile({ gender: 'boy', themeId: 'royal_blue' });
                      }
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      profile.gender === 'boy'
                        ? 'bg-blue-500/25 border-blue-500 text-blue-200'
                        : 'bg-stone-800/80 border-stone-700 text-stone-400'
                    }`}
                  >
                    👦 Boy
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Theme & Style Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>3D Animation Theme & Background</span>
              </span>
              {profile.themeId === 'jungle_safari' && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  🎬 3D Motion Video Active
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEMES_METADATA.map((theme) => {
                const isSelected = profile.themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() =>
                      onChangeProfile({
                        themeId: theme.id,
                        videoSource: theme.id === 'jungle_safari' ? '/assets/jungle_safari_video.mp4' : undefined,
                      })
                    }
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? `bg-gradient-to-br ${theme.gradient} ${theme.borderColor} text-white shadow-lg ring-1 ring-white/20`
                        : 'bg-stone-800/60 border-stone-700/80 text-stone-300 hover:bg-stone-800 hover:border-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xl">{theme.emoji}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-stone-900/60 text-stone-400 border-stone-800'
                      }`}>
                        {theme.gender === 'boy' ? '👦 Boy' : theme.gender === 'girl' ? '👧 Girl' : '✨ Unisex'}
                      </span>
                    </div>

                    <span className={`text-xs font-bold leading-tight ${isSelected ? theme.textColor : 'text-white'}`}>
                      {theme.name}
                    </span>

                    <span className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                      {theme.subline}
                    </span>

                    <div className="mt-2 flex items-center justify-between w-full">
                      <span className="text-[9px] font-bold text-amber-300/90 tracking-wide uppercase">
                        {theme.badge}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safari Jeep Bumper Plaque Text (Replaces old e-invite watermark) */}
          {profile.themeId === 'jungle_safari' && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <label htmlFor="jungle-badge-text-input" className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span>🚙 Safari Jeep Front Plaque Text</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Replaces e-invite watermark
                </span>
              </div>
              <input
                id="jungle-badge-text-input"
                type="text"
                value={profile.jungleBadgeText ?? ''}
                onChange={(e) => onChangeProfile({ jungleBadgeText: e.target.value })}
                placeholder={profile.gender === 'girl' ? "Aneira's Wild Safari" : "Leo's Wild Safari"}
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white placeholder-stone-500 transition-all"
              />
              <p className="text-[10px] text-stone-400">
                Custom plate text displayed across the safari jeep grill plaque in Scene 1 (0s–7s).
              </p>
            </div>
          )}

          {/* Photo Upload */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>Upload Baby's Photo</span>
              </label>
              {profile.photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="baby-photo-upload-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {profile.photoUrl ? (
              <div className="flex items-center gap-3 p-3 bg-stone-800/60 rounded-xl border border-pink-500/30">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400 shadow-md flex-shrink-0">
                  <img
                    src={profile.photoUrl}
                    alt="Baby Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px]">
                    ✓
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">Baby photo attached!</p>
                  <p className="text-[11px] text-stone-400">
                    Appears inside the 3D animated floral cameo frame in Scene 2.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-pink-400 hover:text-pink-300 underline mt-1"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-700 hover:border-pink-500/70 rounded-xl bg-stone-800/40 hover:bg-stone-800/70 transition-all cursor-pointer group"
              >
                <Upload className="w-6 h-6 text-stone-400 group-hover:text-pink-400 transition-colors mb-1" />
                <p className="text-xs font-semibold text-stone-200">Click or drag baby photo here</p>
                <p className="text-[10px] text-stone-400 mt-0.5">PNG, JPG (or keep default 3D doll character)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Event & Venue Details */}
      {activeTab === 'venue' && (
        <div className="flex flex-col gap-6 bg-stone-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
          <div className="pb-3 border-b border-stone-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Event Details, Time & Venue</span>
            </h3>
            <p className="text-xs text-stone-400">
              Displayed across the train carriages and the final blessing invitation card.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-date-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>Celebration Date</span>
              </label>
              <input
                id="event-date-input"
                type="text"
                value={profile.date}
                onChange={(e) => onChangeProfile({ date: e.target.value })}
                placeholder="e.g. 15 June 2026"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="event-time-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>Time</span>
              </label>
              <input
                id="event-time-input"
                type="text"
                value={profile.time}
                onChange={(e) => onChangeProfile({ time: e.target.value })}
                placeholder="e.g. 6:00 PM onwards"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            {/* Venue Name & Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="venue-name-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>Venue Name</span>
              </label>
              <input
                id="venue-name-input"
                type="text"
                value={profile.venueName}
                onChange={(e) => onChangeProfile({ venueName: e.target.value })}
                placeholder="e.g. Little Stars Party Hall"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="venue-address-input" className="text-xs font-semibold text-stone-300">
                Venue Address / Area
              </label>
              <input
                id="venue-address-input"
                type="text"
                value={profile.venueAddress}
                onChange={(e) => onChangeProfile({ venueAddress: e.target.value })}
                placeholder="e.g. Satellite Road, Ahmedabad"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>

            {/* Parents' Names */}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="parents-names-input" className="text-xs font-semibold text-stone-300 flex items-center gap-1">
                <Users className="w-3 h-3 text-stone-400" />
                <span>Parents' Names (Sign-off Card)</span>
              </label>
              <input
                id="parents-names-input"
                type="text"
                value={profile.parentsNames}
                onChange={(e) => onChangeProfile({ parentsNames: e.target.value })}
                placeholder="e.g. Mr. Rohan Patel & Mrs. Priya Patel"
                className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-sm text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Sparkles & Visual Effects */}
      {activeTab === 'visuals' && (
        <div className="flex flex-col gap-6 bg-stone-900/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
          <div className="pb-3 border-b border-stone-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sparkles, Rhyme & Invitation Message</span>
            </h3>
            <p className="text-xs text-stone-400">
              Customize golden sparkles intensity and custom celebratory rhymes.
            </p>
          </div>

          {/* AI Rhyme Generator */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" />
                <span>Celebration Rhyme (Scene 4 & 7)</span>
              </label>

              <button
                id="generate-ai-verse-btn"
                type="button"
                onClick={handleGenerateVerse}
                disabled={isGeneratingVerse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-300 hover:text-white border border-pink-500/40 text-xs font-semibold hover:bg-pink-500/30 transition-all cursor-pointer"
              >
                {isGeneratingVerse ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Crafting AI Rhyme...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate Custom AI Rhyme</span>
                  </>
                )}
              </button>
            </div>

            {aiVerseMessage && <p className="text-xs text-emerald-400 font-medium">{aiVerseMessage}</p>}

            <textarea
              id="custom-verse-textarea"
              rows={2}
              value={profile.customVerse}
              onChange={(e) => onChangeProfile({ customVerse: e.target.value })}
              className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 focus:border-pink-500 text-xs text-stone-200"
            />
          </div>

          {/* Sparkles Intensity Slider */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Golden Star Sparkles Intensity:</span>
            </span>
            <div className="flex items-center gap-3">
              <input
                id="sparkle-intensity-slider"
                type="range"
                min="0"
                max="100"
                value={config.sparkleIntensity}
                onChange={(e) => onChangeConfig({ sparkleIntensity: parseInt(e.target.value) || 50 })}
                className="w-32 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span className="text-stone-300 font-mono text-xs">{config.sparkleIntensity}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Google Sheets & RSVPs Tracker */}
      {activeTab === 'sheets' && (
        <GoogleSheetsManager
          profile={profile}
          onChangeProfile={onChangeProfile}
        />
      )}
    </div>
  );
};
