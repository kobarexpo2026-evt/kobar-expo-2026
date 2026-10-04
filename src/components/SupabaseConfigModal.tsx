import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { 
  getCurrentSupabaseConfig, 
  saveSupabaseCredentials, 
  clearSupabaseCredentials 
} from '../lib/supabase/client';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Key, 
  Copy, 
  Terminal, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getCurrentSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.key || '');
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql'>('credentials');
  const [copiedSql, setCopiedSql] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Harap masukkan Project URL dan Public Anon Key dari Supabase!');
      return;
    }
    saveSupabaseCredentials(url, anonKey);
  };

  const handleReset = () => {
    if (confirm('Hapus kredensial Supabase tersimpan dan kembali ke Demo Mode?')) {
      clearSupabaseCredentials();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8 bg-white dark:bg-[#201813] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/40">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fredoka font-bold text-lg text-stone-900 dark:text-stone-100">
                  Panduan & Setup Supabase Asli
                </h3>
                <Badge variant={currentConfig.isConfigured ? 'success' : 'neutral'} className="text-[10px]">
                  {currentConfig.isConfigured ? 'Terhubung (Live)' : 'Demo Mode (Offline)'}
                </Badge>
              </div>
              <p className="text-xs text-stone-500 font-baloo">
                Hubungkan langsung ke PostgreSQL & Supabase Auth milik Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 px-6 pt-3 gap-4 text-xs font-bold font-fredoka">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'credentials'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            1. Input Kredensial URL & Key
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            2. Menjalankan SQL Migrasi di Supabase
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto font-baloo text-xs md:text-sm">
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-stone-700 dark:text-stone-300 space-y-2">
                <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Di mana menemukan URL dan Anon Key di Supabase?
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-stone-600 dark:text-stone-400">
                  <li>Buka proyek Supabase Anda di <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-amber-600 underline font-semibold">supabase.com/dashboard</a>.</li>
                  <li>Klik menu <strong>Project Settings</strong> (ikon gerigi di kiri bawah) &gt; <strong>API</strong>.</li>
                  <li>Salin <strong>Project URL</strong> (contoh: <code className="bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded">https://xyzcompany.supabase.co</code>).</li>
                  <li>Salin <strong>Project API Keys &gt; anon / public</strong> key.</li>
                </ol>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Supabase Project URL"
                  placeholder="https://your-project.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />

                <Input
                  label="Supabase Public Anon Key"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between pt-2">
                  {currentConfig.isConfigured ? (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus kredensial (Kembali ke Demo)
                    </button>
                  ) : <div />}

                  <Button type="submit" variant="festival" size="md">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Simpan & Hubungkan Database
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <p className="text-stone-600 dark:text-stone-300">
                Jalankan script SQL berikut di menu <strong>SQL Editor</strong> pada Dashboard Supabase Anda:
              </p>

              {/* Step 1: Init Schema */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-fredoka font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-teal-600" />
                    1. Skema Tabel, RLS, Bucket & Pendaftaran Atomik
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">20260101000000_init_kobar_expo.sql</span>
                </div>
                <p className="text-xs text-stone-500">
                  Membuat tabel profiles, events, form_fields, registrations, payment_submissions, storage bucket assets & registrations.
                </p>
                <div className="text-[11px] font-mono bg-stone-900 text-stone-100 p-2 rounded-xl flex items-center justify-between">
                  <span>File tersimpan di: /supabase/migrations/20260101000000_init_kobar_expo.sql</span>
                </div>
              </div>

              {/* Step 2: RPC Tahap 2 */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-fredoka font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    2. RPC Drag & Drop, Bulk Kode Undangan & Save Admin
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">20260102000000_tahap2_rpc.sql</span>
                </div>
                <p className="text-xs text-stone-500">
                  Fungsi PostgreSQL server-side: reorder_events, generate_invitation_codes_bulk, dan save_admin_user.
                </p>
                <div className="text-[11px] font-mono bg-stone-900 text-stone-100 p-2 rounded-xl flex items-center justify-between">
                  <span>File tersimpan di: /supabase/migrations/20260102000000_tahap2_rpc.sql</span>
                </div>
              </div>

              {/* Step 3: Seed Super Admin & Events */}
              <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-fredoka font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-emerald-600" />
                    3. Seeding Super Admin & Agenda Event Awal
                  </span>
                  <span className="text-[11px] font-mono text-stone-500">seed.sql</span>
                </div>
                <p className="text-xs text-stone-500">
                  Membuat akun Super Admin dengan email <strong className="text-stone-800 dark:text-stone-200">ananda.poji@gmail.com</strong> dan password <strong className="text-stone-800 dark:text-stone-200">KobarExpo2026SuperAdmin!</strong>.
                </p>
                <div className="text-[11px] font-mono bg-stone-900 text-stone-100 p-2 rounded-xl flex items-center justify-between">
                  <span>File tersimpan di: /supabase/seed.sql</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/30">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
          >
            <span>Buka Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <Button onClick={onClose} variant="ghost" size="sm">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
