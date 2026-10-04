import React, { useState } from 'react';
import { InvoiceTemplateItem, emailInvoiceService, DEFAULT_INVOICE_HTML } from '../../../lib/services/emailInvoiceService';
import { PlaceholderChipBar } from './PlaceholderChipBar';
import { Button } from '../../ui/Button';
import { FileText, Save, Eye, RotateCcw, Printer, CheckCircle2 } from 'lucide-react';
import { Registration } from '../../../types/database';

interface InvoiceTemplateEditorProps {
  template: InvoiceTemplateItem;
  dynamicFieldLabels: string[];
  onSaveTemplate: (template: InvoiceTemplateItem) => Promise<boolean>;
}

const SAMPLE_PARTICIPANT: Registration = {
  id: 'preview-inv-reg',
  reg_id: 'EVT-2026-00088',
  event_id: 'event-demo',
  nama: 'Dina Rahmawati (Dapur Dayak)',
  email: 'dina@example.com',
  wa: '081234567890',
  status_bayar: 'Lunas',
  status_lulus: 'Lulus',
  answers: {
    'Nama Usaha': 'Dapur Dayak Delights',
    'Kategori Booth': 'Kuliner Basah & Minuman',
  },
  created_at: new Date().toISOString(),
  event_nama: 'Bazar Kuliner Khas & Booth UMKM Unggulan Kobar',
  event_harga: 500000,
};

export const InvoiceTemplateEditor: React.FC<InvoiceTemplateEditorProps> = ({
  template,
  dynamicFieldLabels,
  onSaveTemplate,
}) => {
  const [htmlContent, setHtmlContent] = useState(template.template_html || DEFAULT_INVOICE_HTML);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInsertChip = (placeholder: string) => {
    setHtmlContent((prev) => prev + placeholder);
  };

  const handleReset = () => {
    if (confirm('Kembalikan ke template standar bawaan sistem?')) {
      setHtmlContent(DEFAULT_INVOICE_HTML);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const success = await onSaveTemplate({
      ...template,
      template_html: htmlContent,
    });
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const handlePrintTest = () => {
    emailInvoiceService.downloadInvoicePdf(SAMPLE_PARTICIPANT, htmlContent);
  };

  const renderedInvoiceHtml = emailInvoiceService.replacePlaceholders(htmlContent, SAMPLE_PARTICIPANT);

  return (
    <div className="space-y-4 font-baloo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-850 shadow-2xs">
        <div>
          <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Desain & Tata Letak Template Invoice PDF</span>
          </h3>
          <p className="text-xs text-stone-500">
            Kustomisasi dokumen tanda terima invoice resmi yang otomatis dicetak atau dilampirkan ke email.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Tab */}
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
              HTML Source
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
              <span>Pratinjau PDF</span>
            </button>
          </div>

          <Button
            type="button"
            onClick={handlePrintTest}
            variant="outline"
            size="sm"
            className="text-xs text-teal-700 dark:text-teal-400"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Cetak PDF
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            variant="festival"
            size="sm"
            isLoading={isSaving}
            className="text-xs font-bold shadow-md"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Simpan Invoice
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Template invoice berhasil disimpan!</span>
        </div>
      )}

      {activeTab === 'editor' ? (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-850 shadow-2xs space-y-4">
          <PlaceholderChipBar
            onInsertChip={handleInsertChip}
            dynamicFieldLabels={dynamicFieldLabels}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Kode HTML Template Invoice:
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Standar</span>
              </button>
            </div>

            <textarea
              rows={18}
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="w-full p-3 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>
        </div>
      ) : (
        /* Live Rendered Invoice Preview */
        <div className="p-6 rounded-2xl bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-850 shadow-2xs space-y-3">
          <div className="border border-stone-300 dark:border-stone-700 rounded-2xl overflow-hidden shadow-lg bg-white">
            <iframe
              srcDoc={renderedInvoiceHtml}
              title="Invoice Preview"
              className="w-full h-[600px] border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
};
