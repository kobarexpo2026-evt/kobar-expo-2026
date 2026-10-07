import React, { useState, useEffect } from 'react';
import { 
  initGoogleAuth, 
  signInWithGoogle, 
  signOutGoogle, 
  getCurrentGoogleUser, 
  getGoogleAccessToken,
  sendGmailMessage
} from '../../../lib/google/gmailService';
import { User } from 'firebase/auth';
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
  ExternalLink
} from 'lucide-react';

interface GoogleWorkspaceConnectCardProps {
  onStatusChange?: (user: User | null) => void;
}

export const GoogleWorkspaceConnectCard: React.FC<GoogleWorkspaceConnectCardProps> = ({
  onStatusChange,
}) => {
  const [user, setUser] = useState<User | null>(getCurrentGoogleUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [testTo, setTestTo] = useState('ananda.poji@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

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

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setTestResult(null);
    try {
      const res = await signInWithGoogle();
      if (res) {
        setUser(res.user);
        if (onStatusChange) onStatusChange(res.user);
        if (res.user.email) setTestTo(res.user.email);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err.message || 'Gagal masuk ke akun Google.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setUser(null);
    if (onStatusChange) onStatusChange(null);
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                  Belum Terhubung
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Kirim email pendaftaran & invoice langsung menggunakan akun Google Anda (100% masuk Inbox Utama).
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

      {/* Feedback Alert */}
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
