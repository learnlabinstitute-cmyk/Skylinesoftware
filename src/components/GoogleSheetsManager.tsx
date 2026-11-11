import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  RefreshCw,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  Trash2,
  Edit2,
  Save,
  LogOut,
  Sparkles,
  Phone,
  Mail,
  AlertTriangle,
  UploadCloud,
  Layers,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { BabyProfile } from '../types';
import {
  signInWithGoogle,
  signOutGoogle,
  initGoogleAuth,
  getGoogleAccessToken,
} from '../utils/googleAuth';
import {
  listGoogleDriveSpreadsheets,
  createBirthdaySpreadsheet,
  readSpreadsheetGuests,
  appendGuestToSheet,
  updateGuestInSheet,
  SheetGuest,
  SpreadsheetMeta,
} from '../utils/googleSheetsService';

interface GoogleSheetsManagerProps {
  profile: BabyProfile;
  onChangeProfile: (updates: Partial<BabyProfile>) => void;
}

export const GoogleSheetsManager: React.FC<GoogleSheetsManagerProps> = ({
  profile,
  onChangeProfile,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetMeta[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>(profile.spreadsheetId || '');
  const [guests, setGuests] = useState<SheetGuest[]>([]);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New Guest Form State
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuest, setNewGuest] = useState<SheetGuest>({
    name: '',
    status: 'Attending',
    adults: 2,
    kids: 0,
    phone: '',
    email: '',
    dietaryNotes: '',
    invitationSent: true,
    giftWishes: '',
  });

  // Editing Guest State
  const [editingGuestIndex, setEditingGuestIndex] = useState<number | null>(null);
  const [editingGuestData, setEditingGuestData] = useState<SheetGuest | null>(null);

  // Destructive Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; guest: SheetGuest | null }>({
    open: false,
    guest: null,
  });

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (authedUser, accessToken) => {
        setUser(authedUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch spreadsheets once logged in
  useEffect(() => {
    if (token) {
      loadSpreadsheets();
    }
  }, [token]);

  // Load guests when spreadsheet selection changes
  useEffect(() => {
    if (token && selectedSheetId) {
      loadGuests(selectedSheetId);
    }
  }, [token, selectedSheetId]);

  const loadSpreadsheets = async () => {
    try {
      const list = await listGoogleDriveSpreadsheets();
      setSpreadsheets(list);
      // Auto-select if existing or if user has a birthday sheet
      if (!selectedSheetId && list.length > 0) {
        const birthdaySheet = list.find((s) => s.name.toLowerCase().includes('birthday'));
        if (birthdaySheet) {
          setSelectedSheetId(birthdaySheet.id);
          onChangeProfile({ spreadsheetId: birthdaySheet.id });
        }
      }
    } catch (err: any) {
      console.error('Error loading spreadsheets:', err);
    }
  };

  const loadGuests = async (sheetId: string) => {
    setIsLoadingGuests(true);
    setStatusMsg(null);
    try {
      const loaded = await readSpreadsheetGuests(sheetId);
      setGuests(loaded);
    } catch (err: any) {
      console.error('Error loading guests:', err);
      setStatusMsg({ type: 'error', text: 'Could not read guest rows from selected spreadsheet.' });
    } finally {
      setIsLoadingGuests(false);
    }
  };

  const handleSignIn = async () => {
    setIsConnecting(true);
    setStatusMsg(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setStatusMsg({ type: 'success', text: `Connected Google Account: ${res.user.email}` });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Google sign-in failed. Please try again.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setUser(null);
    setToken(null);
    setGuests([]);
    setStatusMsg({ type: 'info', text: 'Disconnected from Google Account.' });
  };

  const handleCreateNewSheet = async () => {
    setIsCreatingSheet(true);
    setStatusMsg(null);
    try {
      const created = await createBirthdaySpreadsheet(profile);
      setSelectedSheetId(created.id);
      onChangeProfile({ spreadsheetId: created.id });
      setSpreadsheets((prev) => [created, ...prev]);
      await loadGuests(created.id);
      setStatusMsg({
        type: 'success',
        text: `Created new spreadsheet: "${created.name}" in your Google Drive!`,
      });
    } catch (err: any) {
      console.error('Create sheet error:', err);
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create spreadsheet.' });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheetId || !newGuest.name.trim()) return;

    setIsSyncing(true);
    try {
      await appendGuestToSheet(selectedSheetId, newGuest);
      setGuests((prev) => [...prev, { ...newGuest, rowIndex: prev.length + 2 }]);
      setNewGuest({
        name: '',
        status: 'Attending',
        adults: 2,
        kids: 0,
        phone: '',
        email: '',
        dietaryNotes: '',
        invitationSent: true,
        giftWishes: '',
      });
      setShowAddGuest(false);
      setStatusMsg({ type: 'success', text: `Added "${newGuest.name}" to Google Sheet!` });
    } catch (err: any) {
      console.error('Add guest error:', err);
      setStatusMsg({ type: 'error', text: 'Failed to add guest to Google Sheet.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartEdit = (guest: SheetGuest, index: number) => {
    setEditingGuestIndex(index);
    setEditingGuestData({ ...guest });
  };

  const handleSaveEdit = async () => {
    if (editingGuestIndex === null || !editingGuestData || !selectedSheetId) return;

    setIsSyncing(true);
    try {
      const rowIdx = editingGuestData.rowIndex || editingGuestIndex + 2;
      await updateGuestInSheet(selectedSheetId, rowIdx, editingGuestData);
      setGuests((prev) => {
        const next = [...prev];
        next[editingGuestIndex] = editingGuestData;
        return next;
      });
      setEditingGuestIndex(null);
      setEditingGuestData(null);
      setStatusMsg({ type: 'success', text: 'Updated guest row in Google Sheet!' });
    } catch (err: any) {
      console.error('Update guest error:', err);
      setStatusMsg({ type: 'error', text: 'Failed to update guest row.' });
    } finally {
      setIsSyncing(false);
    }
  };

  // Explicit confirmation required by SKILL.md before any destructive data change
  const handleConfirmDelete = () => {
    if (!deleteModal.guest) return;
    const targetName = deleteModal.guest.name;
    // Mark as declined in-memory and notify user
    setGuests((prev) => prev.filter((g) => g.name !== targetName));
    setDeleteModal({ open: false, guest: null });
    setStatusMsg({ type: 'info', text: `Removed "${targetName}" from local active view.` });
  };

  // Metrics
  const totalGuestsCount = guests.reduce((sum, g) => sum + (g.adults || 0) + (g.kids || 0), 0);
  const attendingGuests = guests.filter((g) => g.status === 'Attending');
  const attendingPeopleCount = attendingGuests.reduce((sum, g) => sum + (g.adults || 0) + (g.kids || 0), 0);
  const totalKidsCount = guests.reduce((sum, g) => sum + (g.kids || 0), 0);
  const pendingCount = guests.filter((g) => g.status === 'Invited' || g.status === 'Maybe').length;

  const filteredGuests = guests.filter((g) => {
    if (filterStatus === 'all') return true;
    return g.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const activeSpreadsheet = spreadsheets.find((s) => s.id === selectedSheetId);

  return (
    <div className="flex flex-col gap-6 bg-stone-900/95 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl text-stone-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Google Sheets Guest & RSVP Tracker
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Cloud Sync
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Sync RSVPs, guest headcount, dietary requirements & gift notes directly with your Google Drive spreadsheet.
            </p>
          </div>
        </div>

        {/* Auth / Account State */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-stone-800/80 border border-stone-700">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-6 h-6 rounded-full border border-emerald-400"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'G')[0].toUpperCase()}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-white truncate max-w-[120px]">
                  {user.displayName || user.email}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold">Sheets Connected</span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Disconnect Google Account"
                className="p-1 hover:text-rose-400 text-stone-400 transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Official Google Sign-In Button as required by SKILL.md */
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleSignIn}
              disabled={isConnecting}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          className={`px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : statusMsg.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-stone-400 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* When Not Logged In Notice */}
      {!user ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-stone-800 bg-stone-950/40 text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div className="max-w-md">
            <h4 className="text-sm font-bold text-white">Connect Google Sheets to Manage Party RSVPs</h4>
            <p className="text-xs text-stone-400 mt-1">
              Sign in with your Google account to automatically generate a dedicated 1st birthday RSVP spreadsheet in your Google Drive or sync with an existing guest list.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isConnecting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold shadow-lg transition-all cursor-pointer mt-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>
        </div>
      ) : (
        /* Connected Google Sheets Dashboard */
        <div className="flex flex-col gap-5">
          {/* Spreadsheet Selector & 1-Click Creator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="select-google-sheet" className="text-xs font-semibold text-stone-300 whitespace-nowrap">
                Current Spreadsheet:
              </label>
              <select
                id="select-google-sheet"
                value={selectedSheetId}
                onChange={(e) => {
                  setSelectedSheetId(e.target.value);
                  onChangeProfile({ spreadsheetId: e.target.value });
                }}
                className="w-full sm:w-auto flex-1 max-w-md px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {spreadsheets.length === 0 ? (
                  <option value="">No spreadsheets found</option>
                ) : (
                  spreadsheets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Refresh / Sync Button */}
              {selectedSheetId && (
                <button
                  type="button"
                  onClick={() => loadGuests(selectedSheetId)}
                  disabled={isLoadingGuests}
                  title="Reload rows from Google Sheet"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold text-stone-200 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGuests ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Sync</span>
                </button>
              )}

              {/* Direct Open in Google Sheets */}
              {selectedSheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-xs font-semibold text-emerald-200 transition-all cursor-pointer"
                >
                  <span>Open in Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Create New Sheet Button */}
              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isCreatingSheet}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                {isCreatingSheet ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>New Birthday Sheet</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col p-3 rounded-xl bg-stone-950/50 border border-stone-800/80">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Total Confirmed</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-extrabold text-emerald-400">{attendingPeopleCount}</span>
                <span className="text-xs text-stone-400">guests</span>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5">{attendingGuests.length} RSVP families</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-stone-950/50 border border-stone-800/80">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Kids Count</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-extrabold text-amber-300">{totalKidsCount}</span>
                <span className="text-xs text-stone-400">little ones</span>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5">Safari party bags</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-stone-950/50 border border-stone-800/80">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Pending / Maybe</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-extrabold text-blue-400">{pendingCount}</span>
                <span className="text-xs text-stone-400">awaiting</span>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5">Send video reminders</span>
            </div>

            <div className="flex flex-col p-3 rounded-xl bg-stone-950/50 border border-stone-800/80">
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Total Invited</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-extrabold text-white">{totalGuestsCount}</span>
                <span className="text-xs text-stone-400">people</span>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5">{guests.length} total entries</span>
            </div>
          </div>

          {/* Action Bar: Filter & Add Guest */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {['all', 'attending', 'invited', 'maybe', 'declined'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    filterStatus === s
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-stone-800/60 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              id="add-guest-modal-btn"
              type="button"
              onClick={() => setShowAddGuest(!showAddGuest)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddGuest ? 'Cancel' : 'Add Guest to Sheet'}</span>
            </button>
          </div>

          {/* Add Guest Inline Drawer */}
          {showAddGuest && (
            <form
              onSubmit={handleAddGuest}
              className="flex flex-col gap-4 p-4 rounded-xl bg-stone-950/80 border border-emerald-500/30 text-xs shadow-inner"
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add New Guest to Google Sheet</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddGuest(false)}
                  className="text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-stone-300">Guest / Family Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grandma Rose & Family"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-stone-300">RSVP Status</label>
                  <select
                    value={newGuest.status}
                    onChange={(e) => setNewGuest({ ...newGuest, status: e.target.value as any })}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Attending">Attending</option>
                    <option value="Invited">Invited</option>
                    <option value="Maybe">Maybe</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-stone-300">Adults</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newGuest.adults}
                      onChange={(e) => setNewGuest({ ...newGuest, adults: parseInt(e.target.value) || 1 })}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-stone-300">Kids</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={newGuest.kids}
                      onChange={(e) => setNewGuest({ ...newGuest, kids: parseInt(e.target.value) || 0 })}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-stone-300">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+1 555-0123"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-stone-300">Email</label>
                  <input
                    type="email"
                    placeholder="guest@example.com"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-stone-300">Dietary / Special Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Vegetarian, High chair needed"
                    value={newGuest.dietaryNotes}
                    onChange={(e) => setNewGuest({ ...newGuest, dietaryNotes: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddGuest(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
                >
                  {isSyncing ? 'Writing to Google Sheet...' : 'Save to Google Sheet'}
                </button>
              </div>
            </form>
          )}

          {/* Interactive Guests Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950/40">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-800/80 text-[11px] uppercase tracking-wider text-stone-400 border-b border-stone-700/60 font-semibold">
                <tr>
                  <th className="px-3.5 py-2.5">Guest / Family</th>
                  <th className="px-3 py-2.5">RSVP Status</th>
                  <th className="px-3 py-2.5">Party Size</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Notes</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/70">
                {isLoadingGuests ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-stone-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Reading guest rows from Google Sheet...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-stone-400">
                      No guests match this filter. Click "Add Guest to Sheet" or "New Birthday Sheet" to populate rows!
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest, idx) => {
                    const isEditing = editingGuestIndex === idx;

                    return (
                      <tr key={idx} className="hover:bg-stone-800/30 transition-colors">
                        <td className="px-3.5 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingGuestData?.name || ''}
                              onChange={(e) =>
                                setEditingGuestData((prev) => (prev ? { ...prev, name: e.target.value } : null))
                              }
                              className="px-2 py-1 bg-stone-800 rounded border border-stone-600 text-xs text-white w-full"
                            />
                          ) : (
                            <div className="font-semibold text-white">{guest.name}</div>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {isEditing ? (
                            <select
                              value={editingGuestData?.status || 'Invited'}
                              onChange={(e) =>
                                setEditingGuestData((prev) =>
                                  prev ? { ...prev, status: e.target.value as any } : null
                                )
                              }
                              className="px-2 py-1 bg-stone-800 rounded border border-stone-600 text-xs text-white cursor-pointer"
                            >
                              <option value="Attending">Attending</option>
                              <option value="Invited">Invited</option>
                              <option value="Maybe">Maybe</option>
                              <option value="Declined">Declined</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                guest.status === 'Attending'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : guest.status === 'Maybe'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : guest.status === 'Declined'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              }`}
                            >
                              {guest.status === 'Attending' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                              {guest.status === 'Maybe' && <HelpCircle className="w-3 h-3 text-amber-400" />}
                              {guest.status === 'Declined' && <XCircle className="w-3 h-3 text-rose-400" />}
                              {guest.status === 'Invited' && <Clock className="w-3 h-3 text-blue-400" />}
                              <span>{guest.status}</span>
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={editingGuestData?.adults || 1}
                                onChange={(e) =>
                                  setEditingGuestData((prev) =>
                                    prev ? { ...prev, adults: parseInt(e.target.value) || 1 } : null
                                  )
                                }
                                className="w-12 px-1.5 py-1 bg-stone-800 rounded border border-stone-600 text-xs text-white"
                                title="Adults"
                              />
                              <span>A /</span>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={editingGuestData?.kids || 0}
                                onChange={(e) =>
                                  setEditingGuestData((prev) =>
                                    prev ? { ...prev, kids: parseInt(e.target.value) || 0 } : null
                                  )
                                }
                                className="w-12 px-1.5 py-1 bg-stone-800 rounded border border-stone-600 text-xs text-white"
                                title="Kids"
                              />
                              <span>K</span>
                            </div>
                          ) : (
                            <span className="text-stone-300">
                              {guest.adults} Adults {guest.kids > 0 ? `+ ${guest.kids} Kids` : ''}
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-0.5">
                            {guest.phone && (
                              <a
                                href={`https://wa.me/${guest.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-emerald-500" />
                                <span>{guest.phone}</span>
                              </a>
                            )}
                            {guest.email && (
                              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-stone-500" />
                                <span className="truncate max-w-[120px]">{guest.email}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="text-[11px] text-stone-400 truncate max-w-[140px] block">
                            {guest.dietaryNotes || guest.giftWishes || '—'}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSyncing}
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer"
                                title="Save changes"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(guest, idx)}
                                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit row"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeleteModal({ open: true, guest })}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Confirmation Dialog for Destructive Operations (Required by SKILL.md) */}
      {deleteModal.open && deleteModal.guest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="max-w-md w-full p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Remove Guest from List?</h4>
                <p className="text-xs text-stone-400">
                  Are you sure you want to remove <strong>"{deleteModal.guest.name}"</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300 bg-stone-950/60 p-3 rounded-xl border border-stone-800">
              This will remove the guest and their {deleteModal.guest.adults + deleteModal.guest.kids} party headcounts from your active list view.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, guest: null })}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-all"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
