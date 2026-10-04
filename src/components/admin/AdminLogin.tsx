import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ThemeToggle';
import { ShieldCheck, ArrowLeft, KeyRound, AlertCircle, Sparkles, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { SupabaseConfigModal } from '../SupabaseConfigModal';

export const AdminLogin: React.FC<{ onBackToHome: () => void }> = ({ onBackToHome }) => {
  const { login, demoLoginAs, isLoading } = useAuth();
  const [email, setEmail] = useState('ananda.poji@gmail.com');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi Anda.');
      return;
    }

    const res = await login(email, password);
    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleQuickSuperAdminLogin = async () => {
    await login('ananda.poji@gmail.com', 'KobarExpo2026SuperAdmin!');
  };

  return (
    <div className="min-h-screen bg-festival-pattern flex flex-col justify-between p-4 sm:p-6 transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-stone-850/80 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-xs font-mono font-medium text-stone-700 dark:text-stone-300 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-800"
          >
            <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span>{isSupabaseConfigured ? 'Supabase Live' : 'Setup Database'}</span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-teal-500 text-white shadow-lg mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-fredoka text-stone-900 dark:text-stone-100 tracking-wide">
            Portal Admin KOBAR EXPO
          </h1>
          <p className="text-sm font-baloo text-stone-600 dark:text-stone-400 mt-1">
            Event Organizer Management System (EOMS)
          </p>
        </div>

        <Card className="shadow-lg border-2 border-stone-200/90 dark:border-stone-800/90 bg-white/95 dark:bg-[#201813]/95 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Masuk Akun Panitia</CardTitle>
            <CardDescription>
              Akses khusus panitia dan Super Administrator
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Alamat Email"
                type="email"
                placeholder="superadmin@kobarexpo.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Kata Sandi"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="festival"
                className="w-full py-2.5 text-sm"
                isLoading={isLoading}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Masuk ke Dasbor
              </Button>
            </form>

            {/* Direct Super Admin Quick Sign-In */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
              <Button
                type="button"
                onClick={handleQuickSuperAdminLogin}
                variant="outline"
                className="w-full py-2.5 text-xs font-bold border-amber-400 dark:border-amber-700 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200"
              >
                <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
                <span>Masuk Cepat: Super Admin (ananda.poji@gmail.com)</span>
              </Button>

              <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center font-baloo">
                Atau masukkan kata sandi akun Supabase Anda di atas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-stone-500 dark:text-stone-400 py-2 font-baloo">
        &copy; 2026 Pemerintah Kabupaten Kotawaringin Barat &bull; Kobar Expo EOMS v2.0
      </footer>

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
};
