import React, { useState, useEffect } from 'react';
import { Registration } from '../../../types/database';
import { 
  emailInvoiceService, 
  EmailTemplateItem, 
  STANDARD_EMAIL_TRIGGERS 
} from '../../../lib/services/emailInvoiceService';
import { Button } from '../../ui/Button';
import { X, Send, Mail, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { getCurrentGoogleUser } from '../../../lib/google/gmailService';

interface ResendEmailModalProps {
  isOpen: boolean;
  registration: Registration | null;
  onClose: () => void;
}

export const ResendEmailModal: React.FC<ResendEmailModalProps> = ({
  isOpen,
  registration,
  onClose,
}) => {
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<string>('PENDAFTARAN_DITERIMA');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !registration) return;

    const load = async () => {
      setLoadingTemplates(true);
      const list = await emailInvoiceService.getEmailTemplates(registration.event_id);
      setTemplates(list);
      setLoadingTemplates(false);
    };

    load();
  }, [isOpen, registration]);

  if (!isOpen || !registration) return null;

  const activeTemplate = templates.find((t) => t.trigger_key === selectedTrigger) || templates[0];

  const renderedSubject = activeTemplate
    ? emailInvoiceService.replacePlaceholders(activeTemplate.subjek, registration)
    : '';

  let renderedHtml = activeTemplate
    ? emailInvoiceService.replacePlaceholders(activeTemplate.isi_html, registration)
    : '';

  if (activeTemplate?.include_ticket) {
    renderedHtml += emailInvoiceService.generateVisualTicketHtml(registration);
  }

  const handleSend = async () => {
    setIsSending(true);
    setSendSuccess(null);
    setErrorMsg(null);

    const attachments: { filename: string; content: string }[] = [];
    if (activeTemplate?.attach_invoice) {
      try {
        const pdfBase64 = emailInvoiceService.generateInvoicePdfBase64(registration);
        if (pdfBase64) {
          attachments.push({
            filename: `Invoice-Resmi-${registration.reg_id}.pdf`,
            content: pdfBase64,
          });
        }
      } catch (pdfErr) {
        console.warn('Gagal membuat PDF invoice:', pdfErr);
      }
    }

    const googleUser = getCurrentGoogleUser();
    const res = await emailInvoiceService.sendEmail({
      to: registration.email,
      subject: renderedSubject,
      html: renderedHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setIsSending(false);
    if (res.success) {
      if (res.via === 'gmail') {
        setSendSuccess(`Email berhasil dikirim langsung dari akun Google Anda (${googleUser?.email})${attachments.length > 0 ? ' beserta lampiran dokumen Invoice PDF' : ''}!`);
      } else {
        setSendSuccess(res.simulated ? 'Email berhasil disimulasikan!' : `Email berhasil dikirim${attachments.length > 0 ? ' beserta lampiran Invoice PDF' : ''}!`);
      }
      setTimeout(() => {
        onClose();
      }, 2500);
    } else {
      setErrorMsg(res.error || 'Gagal mengirim email.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white dark:bg-[#1E1712] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4 font-baloo">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Mail className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100">
                Kirim Ulang Notifikasi Email
              </h3>
              <p className="text-[11px] text-stone-500">
                {registration.nama} &bull; <span className="font-mono">{registration.email}</span>
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

        {/* Trigger Selection */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            Pilih Jenis Template Notifikasi:
          </label>
          <select
            value={selectedTrigger}
            onChange={(e) => setSelectedTrigger(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-baloo"
          >
            {STANDARD_EMAIL_TRIGGERS.map((st) => (
              <option key={st.key} value={st.key}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {sendSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{sendSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Personalized Email Preview */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-fredoka block">
            Pratinjau Pesan yang Akan Dikirim:
          </span>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
            <div>
              <span className="text-stone-400">Subjek:</span>{' '}
              <span className="font-bold text-stone-800 dark:text-stone-200">{renderedSubject}</span>
            </div>
            <div>
              <span className="text-stone-400">Tujuan:</span>{' '}
              <span className="font-mono text-stone-700 dark:text-stone-300">{registration.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FFFDF7] dark:bg-[#1A1410] max-h-48 overflow-y-auto text-xs font-baloo leading-relaxed shadow-inner">
            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
          <Button type="button" onClick={onClose} variant="ghost" size="sm">
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            variant="festival"
            size="sm"
            isLoading={isSending}
            className="font-bold shadow-md"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Kirim Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
};
