import React, { useState, useEffect } from 'react';
import { 
  initGoogleAuth, 
  signInWithGoogle, 
  signOutGoogle, 
  getCurrentGoogleUser, 
  getGoogleAccessToken,
  sendGmailMessage,
  GoogleAuthUser,
  GoogleAuthError
} from '../../../lib/google/gmailService';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { 
  CheckCircle2, 
  Mail, 
  LogOut, 
  Send, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  ExternalLink,
  Globe,
  Copy,
  Check,
  Server,
  RefreshCw,
  X
} from 'lucide-react';

interface GoogleWorkspaceConnectCardProps {
  onStatusChange?: (user: GoogleAuthUser | null) => void;
}

export const GoogleWorkspaceConnectCard: React.FC<GoogleWorkspaceConnectCardProps> = ({
  onStatusChange,
}) => {
  const [user, setUser] = useState<GoogleAuthUser | null>(getCurrentGoogleUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [testTo, setTestTo] = useState('ananda.poji@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  
  // Specific state for Firebase unauthorized-domain error
  const [unauthorizedError, setUnauthorizedError] = useState<{
    domain: string;
    projectId: string;
    consoleUrl: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (authUser) => {
        setUser(authUser);
        if (onStatusChange) onStatusChange(authUser);
        if (authUser?.email) {
          setTestTo(authUser.email);
        }
      },
      () => {
        setUser(null);
        if (onStatusChange) onStatusChange(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [onStatusChange]);

  const handleCopyDomain = async () => {
    const domain = unauthorizedError?.domain || (typeof window !== 'undefined' ? window.location.hostname : '');
    if (!domain) return;
    try {
      await navigator.clipboard.writeText(domain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    } catch {
      // Fallback
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setTestResult(null);
    setUnauthorizedError(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setUser(res.user);
        if (onStatusChange) onStatusChange(res.user);
        if (res.user.email) setTestTo(res.user.email);
      }
    } catch (err: any) {
      const isDomainErr = 
        err.isUnauthorizedDomain || 
        err.code === 'auth/unauthorized-domain' || 
        (typeof err.message === 'string' && err.message.includes('auth/unauthorized-domain'));

      if (isDomainErr) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'domain';
        setUnauthorizedError({
          domain: err.domain || hostname,
          projectId: err.projectId || 'gen-lang-client-0207757558',
          consoleUrl: err.consoleSettingsUrl || `https://console.firebase.google.com/project/gen-lang-client-0207757558/authentication/settings`,
        });
      } else {
        setTestResult({
          success: false,
          msg: err.message || 'Gagal masuk ke akun Google.',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setUser(null);
    if (onStatusChange) onStatusChange(null);
    setUnauthorizedError(null);
  };

  const handleSendQuickTest = async () => {
    if (!testTo.trim()) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendGmailMessage({
        to: testTo.trim(),
        subject: `[KOBAR EXPO 2026] Uji Coba Pengiriman Resmi via Gmail API (${new Date().toLocaleTimeString('id-ID')})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #d97706; margin: 0; font-size: 20px;">KOBAR EXPO 2026</h2>
              <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Uji Coba Pengiriman Google Workspace / Gmail API</p>
            </div>
            <p style="font-size: 14px; color: #374151; line-height: 1.6;">
              Halo! Email ini dikirimkan langsung dari akun resmi Google Anda (<strong>${user?.email}</strong>) melalui integrasi resmi <strong>Gmail API</strong>.
            </p>
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0; border-radius: 6px;">
              <p style="margin: 0; color: #065f46; font-size: 13px; font-weight: bold;">
                ✓ 100% Anti-Spam & Langsung Masuk Kotak Masuk Utama (Primary Inbox).
              </p>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; text-align: center;">
              Pemerintah Kabupaten Kotawaringin Barat &bull; Panitia Pelaksana KOBAR EXPO 2026
            </p>
          </div>
        `,
      });

      if (res.success) {
        setTestResult({
          success: true,
          msg: `Email berhasil dikirim langsung dari akun ${user?.email} ke ${testTo}! Cek kotak masuk Anda.`,
        });
      } else {
        setTestResult({
          success: false,
          msg: res.error || 'Gagal mengirim email uji coba via Gmail.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err.message || 'Terjadi kesalahan pengiriman.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-teal-500/10 dark:from-amber-950/20 dark:via-[#201813] dark:to-teal-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center shadow-xs shrink-0">
            {/* Google G Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-fredoka">
                Integrasi Google Workspace / Gmail
              </h3>
              {user ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terhubung via Gmail API
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  <Server className="w-3 h-3 text-amber-500" />
                  Mode Server Gateway Aktif (Resend)
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {user 
                ? `Email pendaftaran & invoice resmi dikirimkan langsung dari akun Google Anda (${user.email}).`
                : 'Kirim email langsung dari akun Google Anda (100% Primary Inbox), atau gunakan pengiriman otomatis via server.'}
            </p>
          </div>
        </div>

        {/* Action Button: Sign In / Out */}
        <div className="shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate max-w-[200px]">
                  {user.displayName || 'Akun Google'}
                </p>
                <p className="text-[11px] text-stone-500 font-mono truncate max-w-[200px]">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                title="Keluar / Ganti Akun Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ganti Akun</span>
              </button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleSignIn}
              isLoading={isLoggingIn}
              variant="festival"
              size="sm"
              className="text-xs font-bold shadow-sm"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              Hubungkan Akun Google
            </Button>
          )}
        </div>
      </div>

      {/* Connected State Quick Test Dispatch */}
      {user && (
        <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-500">Kirim email uji coba ke:</span>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="email@example.com"
              className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 w-52 font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
            />
            <Button
              type="button"
              onClick={handleSendQuickTest}
              variant="outline"
              size="sm"
              isLoading={isSendingTest}
              className="text-xs h-7 px-2.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
            >
              <Send className="w-3 h-3 mr-1" />
              Kirim Uji Coba Gmail
            </Button>
          </div>

          <div className="text-[11px] text-stone-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Email resmi akan dikirim atas nama: <strong>{user.email}</strong></span>
          </div>
        </div>
      )}

      {/* Dedicated Interactive Troubleshooting Card for auth/unauthorized-domain */}
      {unauthorizedError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-900 dark:to-amber-950/40 border-2 border-amber-400/80 dark:border-amber-700/80 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-fredoka">
                    Domain Perlu Ditambahkan di Firebase Console
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                    auth/unauthorized-domain
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  Google OAuth Firebase memerlukan otorisasi domain untuk situs web ini sebelum dapat login. Tambahkan domain di bawah ini ke Firebase Console Anda:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUnauthorizedError(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg"
              title="Tutup panduan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Domain Box with 1-Click Copy */}
          <div className="p-3 bg-white dark:bg-stone-950 rounded-xl border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Nama Domain Anda:
              </span>
              <code className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-stone-900 px-2 py-0.5 rounded border border-amber-200 dark:border-stone-800 inline-block select-all">
                {unauthorizedError.domain}
              </code>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyDomain}
                className="text-xs h-8 px-3"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>Salin Domain</span>
                  </>
                )}
              </Button>

              <a
                href={unauthorizedError.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>Buka Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-amber-100/70 dark:bg-stone-900/80 p-3.5 rounded-xl text-xs space-y-2 border border-amber-200/60 dark:border-stone-800">
            <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-300 block">
              Langkah Cepat (Hanya butuh 30 detik):
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-stone-700 dark:text-stone-300 leading-relaxed">
              <li>
                Klik tombol <strong>Buka Firebase Console</strong> di atas (langsung membuka tab <em>Settings</em> project Anda).
              </li>
              <li>
                Gulir ke bagian <strong>Authorized domains</strong> lalu klik <strong>Add domain</strong>.
              </li>
              <li>
                Tempel domain <code className="font-mono font-bold text-amber-800 dark:text-amber-300 bg-white/80 dark:bg-stone-800 px-1 py-0.5 rounded">{unauthorizedError.domain}</code> lalu klik <strong>Add</strong>.
              </li>
              <li>
                Kembali ke halaman ini dan klik tombol <strong>Coba Hubungkan Akun Google Lagi</strong> di bawah.
              </li>
            </ol>
          </div>

          {/* Reassurance Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-amber-200/60 dark:border-stone-800 text-xs">
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Sistem Email Tetap Aktif:</strong> Tiket pendaftaran & invoice otomatis terkirim melalui <em>Server Gateway</em> tanpa kendala.
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              variant="festival"
              onClick={handleSignIn}
              isLoading={isLoggingIn}
              className="text-xs font-bold shrink-0 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Coba Hubungkan Akun Google Lagi
            </Button>
          </div>
        </div>
      )}

      {/* General Feedback Alert */}
      {testResult && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-150 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span>{testResult.msg}</span>
        </div>
      )}
    </div>
  );
};
