import React, { useState } from 'react';
import { emailInvoiceService } from '../../../lib/services/emailInvoiceService';
import { isSupabaseConfigured } from '../../../lib/supabase/client';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { 
  CheckCircle2, 
  Send, 
  Database,
  Server,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  MailCheck
} from 'lucide-react';

interface SupabaseEmailGatewayCardProps {
  onStatusChange?: (status: any) => void;
}

export const SupabaseEmailGatewayCard: React.FC<SupabaseEmailGatewayCardProps> = () => {
  const [testTo, setTestTo] = useState('kobarexpo2026@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string; simulated?: boolean } | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  const handleSendQuickTest = async () => {
    if (!testTo.trim()) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await emailInvoiceService.sendEmail({
        to: testTo.trim(),
        subject: `[KOBAR EXPO 2026] Uji Coba Pengiriman Email Otomatis (${new Date().toLocaleTimeString('id-ID')})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 14px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="color: #d97706; margin: 0; font-size: 20px; font-weight: bold;">KOBAR EXPO 2026</h2>
              <p style="color: #6b7280; font-size: 12px; margin: 4px 0 0 0;">Sistem Manajemen Event & Pendaftaran Resmi (EOMS)</p>
            </div>
            
            <p style="font-size: 14px; color: #374151; line-height: 1.6;">
              Halo Panitia / Administrator! Ini adalah email uji coba resmi dari sistem <strong>KOBAR EXPO 2026</strong>.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 6px;">
              <p style="margin: 0; color: #166534; font-size: 13px; font-weight: bold;">
                ✓ Layanan Pengiriman Email Server & Database Supabase Siap Digunakan.
              </p>
              <p style="margin: 4px 0 0 0; color: #15803d; font-size: 12px;">
                Semua notifikasi pendaftaran, tanda terima pembayaran, serta invoice PDF peserta akan diproses melalui gateway ini.
              </p>
            </div>

            <p style="font-size: 12px; color: #9ca3af; margin-top: 24px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">
              Pemerintah Kabupaten Kotawaringin Barat &bull; Panitia Pelaksana KOBAR EXPO 2026
            </p>
          </div>
        `,
      });

      if (res.success) {
        if (res.simulated) {
          setTestResult({
            success: true,
            simulated: true,
            msg: `Simulasi pengiriman berhasil diproses untuk ${testTo}! (Layanan berjalan dalam mode simulator; masukkan RESEND_API_KEY di environment Vercel jika ingin mengirim ke kotak masuk nyata).`,
          });
        } else {
          setTestResult({
            success: true,
            simulated: false,
            msg: `Email berhasil dikirimkan ke ${testTo}! Silakan cek kotak masuk email Anda.`,
          });
        }
      } else {
        setTestResult({
          success: false,
          msg: res.error || 'Gagal mengirim email uji coba via server gateway.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err.message || 'Terjadi kesalahan saat menghubungi server pengiriman.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-teal-500/10 dark:from-amber-950/20 dark:via-[#201813] dark:to-teal-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <MailCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-fredoka">
                Layanan Notifikasi Email & Database Supabase
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Database: Supabase Aktif
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                <Server className="w-3 h-3 text-amber-500" />
                Server Gateway Otomatis
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Template email tersimpan di tabel <strong>email_templates</strong> Supabase dan dikirim otomatis tanpa perlu autentikasi Firebase.
            </p>
          </div>
        </div>

        {/* Quick Help Toggle */}
        <button
          type="button"
          onClick={() => setShowConfigHelp(!showConfigHelp)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>Panduan Pengiriman</span>
          {showConfigHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Quick Test Email Dispatch */}
      <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-stone-600 dark:text-stone-300 font-medium">Uji coba kirim ke:</span>
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="nama@email.com"
            className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 w-56 font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 shadow-2xs"
          />
          <Button
            type="button"
            onClick={handleSendQuickTest}
            variant="festival"
            size="sm"
            isLoading={isSendingTest}
            className="text-xs h-7 px-3 font-bold shadow-xs"
          >
            <Send className="w-3 h-3 mr-1" />
            Kirim Uji Coba Email
          </Button>
        </div>

        <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Format & subjek tersinkronisasi otomatis dengan <strong>Supabase</strong></span>
        </div>
      </div>

      {/* Collapsible Info/Guide */}
      {showConfigHelp && (
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-stone-900/90 border border-amber-200 dark:border-stone-800 text-xs space-y-2.5 text-stone-700 dark:text-stone-300 animate-in fade-in duration-150">
          <div className="font-bold text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Cara Kerja Pengiriman Email di Vercel & Supabase</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed pl-1">
            <li>
              <strong>Penyimpanan Template:</strong> Seluruh 7 pemicu (trigger) email dan layout invoice PDF disimpan secara terpusat di tabel <code className="bg-amber-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono">email_templates</code> dan <code className="bg-amber-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono">invoice_templates</code> database Supabase Anda.
            </li>
            <li>
              <strong>Pengiriman Otomatis:</strong> Saat calon peserta mendaftar, mengunggah bukti bayar, atau statusnya diubah oleh admin, endpoint backend <code className="bg-amber-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono">/api/send-email</code> akan otomatis memproses dan mengirimkan email.
            </li>
            <li>
              <strong>Aktivasi Pengiriman Nyata (Opsional di Vercel):</strong> Untuk mengirim email ke inbox asli peserta di Vercel, cukup tambahkan variabel environment <code className="bg-amber-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono font-bold">RESEND_API_KEY</code> pada dashboard Vercel Anda (gratis di resend.com). Jika belum dipasang, sistem tetap aman dan mencatat simulasi email.
            </li>
          </ul>
        </div>
      )}

      {/* Test Dispatch Feedback Alert */}
      {testResult && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
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
          <span className="leading-relaxed">{testResult.msg}</span>
        </div>
      )}
    </div>
  );
};
