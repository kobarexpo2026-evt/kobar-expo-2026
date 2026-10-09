import React, { useState, useRef } from 'react';
import { EmailTemplateItem, emailInvoiceService } from '../../../lib/services/emailInvoiceService';
import { PlaceholderChipBar } from './PlaceholderChipBar';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { 
  Mail, 
  Send, 
  Save, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Ticket,
  Paperclip
} from 'lucide-react';
import { Registration } from '../../../types/database';
import { getCurrentGoogleUser } from '../../../lib/google/gmailService';

interface EmailTemplateEditorProps {
  templates: EmailTemplateItem[];
  dynamicFieldLabels: string[];
  onSaveTemplate: (template: EmailTemplateItem) => Promise<boolean>;
}

// Sample simulated participant for preview
const SIMULATED_PARTICIPANT: Registration = {
  id: 'preview-reg',
  reg_id: 'EVT-2026-00088',
  event_id: 'event-demo',
  nama: 'Rian Pratama, S.Pd',
  email: 'rian.pratama@example.com',
  wa: '081234567890',
  status_bayar: 'Lunas',
  status_lulus: 'Lulus',
  answers: {
    'Nama Sanggar / Instansi': 'Sanggar Tingang Mentaya',
    'Kategori Partisipasi': 'Umum / Komunitas',
  },
  created_at: new Date().toISOString(),
  event_nama: 'Lomba Tari Dayak Kreasi & Budaya Nusantara',
  event_harga: 100000,
};

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  templates,
  dynamicFieldLabels,
  onSaveTemplate,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(templates[0]?.trigger_key || 'PENDAFTARAN_DITERIMA');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [currentTemplates, setCurrentTemplates] = useState<EmailTemplateItem[]>(templates);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('ananda.poji@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);
  const [testErrorMsg, setTestErrorMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync state if props change
  React.useEffect(() => {
    setCurrentTemplates(templates);
  }, [templates]);

  const activeTemplate = currentTemplates.find((t) => t.trigger_key === selectedKey) || currentTemplates[0];

  const handleUpdateActiveTemplate = (updates: Partial<EmailTemplateItem>) => {
    setCurrentTemplates((prev) =>
      prev.map((t) => (t.trigger_key === activeTemplate.trigger_key ? { ...t, ...updates } : t))
    );
  };

  const handleInsertChip = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      handleUpdateActiveTemplate({ isi_html: (activeTemplate.isi_html || '') + placeholder });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeTemplate.isi_html || '';
    const updated = current.substring(0, start) + placeholder + current.substring(end);
    handleUpdateActiveTemplate({ isi_html: updated });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 50);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const success = await onSaveTemplate(activeTemplate);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) return;
    setIsSendingTest(true);
    setTestSentMsg(null);
    setTestErrorMsg(null);

    const renderedSubject = emailInvoiceService.replacePlaceholders(activeTemplate.subjek, SIMULATED_PARTICIPANT);
    let renderedHtml = emailInvoiceService.replacePlaceholders(activeTemplate.isi_html, SIMULATED_PARTICIPANT);

    if (activeTemplate.include_ticket) {
      renderedHtml += emailInvoiceService.generateVisualTicketHtml(SIMULATED_PARTICIPANT);
    }

    const attachments: { filename: string; content: string }[] = [];
    if (activeTemplate.attach_invoice) {
      try {
        const pdfBase64 = emailInvoiceService.generateInvoicePdfBase64(SIMULATED_PARTICIPANT);
        if (pdfBase64) {
          attachments.push({
            filename: `Invoice-Resmi-${SIMULATED_PARTICIPANT.reg_id}.pdf`,
            content: pdfBase64,
          });
        }
      } catch (pdfErr) {
        console.warn('Gagal membuat PDF attachment:', pdfErr);
      }
    }

    const googleUser = getCurrentGoogleUser();
    const res = await emailInvoiceService.sendEmail({
      to: testEmailTo.trim(),
      subject: `[Uji Coba ${googleUser ? 'Gmail' : 'Email'}] ${renderedSubject}`,
      html: renderedHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setIsSendingTest(false);
    if (res.success) {
      if (res.via === 'gmail') {
        setTestSentMsg(`Email uji coba BERHASIL dikirim langsung dari akun Google Anda (${googleUser?.email})${attachments.length > 0 ? ' beserta lampiran dokumen Invoice PDF' : ''}! Silakan cek Kotak Masuk email.`);
      } else {
        setTestSentMsg(res.simulated ? 'Email uji coba disimulasikan (layanan belum aktif).' : `Email uji coba berhasil dikirim${attachments.length > 0 ? ' beserta lampiran Invoice PDF' : ''}! Silakan cek kotak masuk email Anda.`);
      }
      setTimeout(() => setTestSentMsg(null), 7000);
    } else {
      setTestErrorMsg(res.error || 'Gagal mengirim email.');
    }
  };

  // Generate preview content
  const previewSubject = activeTemplate ? emailInvoiceService.replacePlaceholders(activeTemplate.subjek, SIMULATED_PARTICIPANT) : '';
  const previewHtml = activeTemplate ? emailInvoiceService.replacePlaceholders(activeTemplate.isi_html, SIMULATED_PARTICIPANT) : '';
  const ticketHtml = activeTemplate?.include_ticket ? emailInvoiceService.generateVisualTicketHtml(SIMULATED_PARTICIPANT) : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-baloo">
      {/* Left Trigger Selector Sidebar */}
      <div className="lg:col-span-4 space-y-2">
        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-fredoka block">
          Pilih Pemicu Notifikasi (7 Trigger):
        </span>
        <div className="space-y-1.5">
          {currentTemplates.map((t) => (
            <button
              key={t.trigger_key}
              type="button"
              onClick={() => setSelectedKey(t.trigger_key)}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                selectedKey === t.trigger_key
                  ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 shadow-xs'
                  : 'border-stone-200 dark:border-stone-850 bg-white dark:bg-[#201813] hover:bg-stone-50 dark:hover:bg-stone-850'
              }`}
            >
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 block">
                  {t.trigger_label}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  Trigger: {t.trigger_key}
                </span>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  t.aktif ? 'bg-emerald-500 shadow-xs' : 'bg-stone-300 dark:bg-stone-700'
                }`}
                title={t.aktif ? 'Status: Aktif' : 'Status: Nonaktif'}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Right Template Content Editor & Preview */}
      <div className="lg:col-span-8 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-850 shadow-2xs">
          <div>
            <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>{activeTemplate.trigger_label}</span>
            </h3>
            <p className="text-xs text-stone-500">
              Konfigurasi subjek dan format pesan email otomatis via Resend.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Active Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-bold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activeTemplate.aktif}
                onChange={(e) => handleUpdateActiveTemplate({ aktif: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span className={activeTemplate.aktif ? 'text-emerald-600' : 'text-stone-400'}>
                {activeTemplate.aktif ? 'Aktif' : 'Nonaktif'}
              </span>
            </label>

            {/* Switch Mode Tab */}
            <div className="flex rounded-xl bg-stone-100 dark:bg-stone-850 p-1 border border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Template email berhasil disimpan ke database!</span>
          </div>
        )}

        {testSentMsg && (
          <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-sky-600" />
            <span>{testSentMsg}</span>
          </div>
        )}

        {testErrorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <div>
              <strong className="block font-semibold">Gagal mengirim email:</strong>
              <span>{testErrorMsg}</span>
            </div>
          </div>
        )}

        {activeTab === 'editor' ? (
          <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-850 shadow-2xs">
            {/* Subject Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                Subjek Email:
              </label>
              <Input
                value={activeTemplate.subjek}
                onChange={(e) => handleUpdateActiveTemplate({ subjek: e.target.value })}
                placeholder="Contoh: Konfirmasi Pendaftaran KOBAR EXPO 2026 ({regId})"
                className="text-xs"
              />
            </div>

            {/* Clickable Chips */}
            <PlaceholderChipBar
              onInsertChip={handleInsertChip}
              dynamicFieldLabels={dynamicFieldLabels}
            />

            {/* HTML Body Editor */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                Isi Pesan Email (Mendukung HTML & Placeholder):
              </label>
              <textarea
                ref={textareaRef}
                rows={10}
                value={activeTemplate.isi_html}
                onChange={(e) => handleUpdateActiveTemplate({ isi_html: e.target.value })}
                className="w-full p-3 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 leading-relaxed"
                placeholder="Tuliskan isi email di sini..."
              />
            </div>

            {/* Special Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
              {/* Checkbox Visual Ticket (specifically for PENDAFTARAN_DITERIMA) */}
              {activeTemplate.trigger_key === 'PENDAFTARAN_DITERIMA' && (
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(activeTemplate.include_ticket)}
                    onChange={(e) => handleUpdateActiveTemplate({ include_ticket: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <Ticket className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sertakan Tiket Visual HTML Resmi KOBAR EXPO 2026 di Dalam Pesan Email</span>
                </label>
              )}

              {/* Checkbox Attach Invoice PDF */}
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer select-none flex-wrap">
                <input
                  type="checkbox"
                  checked={Boolean(activeTemplate.attach_invoice)}
                  onChange={(e) => handleUpdateActiveTemplate({ attach_invoice: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <Paperclip className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Lampirkan Dokumen Invoice PDF Resmi pada Email Ini</span>
                {Boolean(activeTemplate.attach_invoice) && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800 animate-in fade-in duration-150">
                    PDF Terlampir Otomatis 📎
                  </span>
                )}
              </label>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Test Email Box */}
              <div className="space-y-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="cvmasayacreative@gmail.com"
                    className="w-56 text-xs py-1.5"
                  />
                  <Button
                    type="button"
                    onClick={handleSendTestEmail}
                    variant="outline"
                    size="sm"
                    isLoading={isSendingTest}
                    className="text-xs shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Kirim Uji Coba
                  </Button>
                </div>
                <p className="text-[10px] text-stone-400">
                  {getCurrentGoogleUser() ? (
                    <span>*Email akan dikirimkan langsung dari akun resmi Google Anda (<strong className="text-emerald-600 dark:text-emerald-400">{getCurrentGoogleUser()?.email}</strong>) melalui Gmail API.</span>
                  ) : (
                    <span>*Hubungkan akun Google Anda di bagian atas untuk pengiriman langsung via Gmail API, atau gunakan server cadangan.</span>
                  )}
                </p>
              </div>

              {/* Save Button */}
              <Button
                type="button"
                onClick={handleSave}
                variant="festival"
                size="sm"
                isLoading={isSaving}
                className="text-xs font-bold shadow-md"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Simpan Template
              </Button>
            </div>
          </div>
        ) : (
          /* Live HTML Email Preview */
          <div className="p-6 rounded-2xl bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-850 shadow-2xs space-y-4">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 space-y-1 text-xs">
              <div>
                <span className="text-stone-400">Dari:</span>{' '}
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {getCurrentGoogleUser() 
                    ? `KOBAR EXPO 2026 <${getCurrentGoogleUser()?.email}>` 
                    : 'KOBAR EXPO 2026 <noreply@kobarexpo.id>'}
                </span>
              </div>
              <div>
                <span className="text-stone-400">Kepada:</span>{' '}
                <span className="font-semibold text-stone-700 dark:text-stone-300">{SIMULATED_PARTICIPANT.nama} &lt;{SIMULATED_PARTICIPANT.email}&gt;</span>
              </div>
              <div>
                <span className="text-stone-400">Subjek:</span>{' '}
                <span className="font-bold text-amber-700 dark:text-amber-400">{previewSubject}</span>
              </div>
            </div>

            {/* Email Render Content */}
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-[#FFFDF7] dark:bg-[#1A1410] text-stone-900 dark:text-stone-100 text-xs font-baloo leading-relaxed shadow-inner">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              {activeTemplate.include_ticket && (
                <div dangerouslySetInnerHTML={{ __html: ticketHtml }} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
