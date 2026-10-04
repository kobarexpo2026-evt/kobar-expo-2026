import React, { useState, useEffect } from 'react';
import { Registration } from '../../../types/database';
import { registrationService, RegistrationFileItem } from '../../../lib/services/registrationService';
import { Button } from '../../ui/Button';
import { 
  X, 
  Paperclip, 
  FileText, 
  ExternalLink, 
  Download, 
  PenTool, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface AttachmentGalleryModalProps {
  isOpen: boolean;
  registration: Registration | null;
  onClose: () => void;
}

export const AttachmentGalleryModal: React.FC<AttachmentGalleryModalProps> = ({
  isOpen,
  registration,
  onClose,
}) => {
  const [files, setFiles] = useState<RegistrationFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !registration) return;

    const loadFiles = async () => {
      setLoading(true);
      const items = await registrationService.getRegistrationFiles(registration);
      setFiles(items);
      setLoading(false);
    };

    loadFiles();
  }, [isOpen, registration]);

  if (!isOpen || !registration) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-[#1E1712] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4 font-baloo">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Paperclip className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100">
                Galeri Lampiran & Dokumen Peserta
              </h3>
              <p className="text-[11px] text-stone-500">
                {registration.nama} &bull; No. Reg: <span className="font-mono font-bold text-amber-600">{registration.reg_id}</span>
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

        {/* Big Image Lightbox if clicked */}
        {activeImagePreview && (
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-700 text-center space-y-2">
            <div className="flex justify-between items-center text-xs text-white pb-1">
              <span>Pratinjau Resolusi Penuh</span>
              <button
                onClick={() => setActiveImagePreview(null)}
                className="text-stone-400 hover:text-white"
              >
                Tutup Pratinjau
              </button>
            </div>
            <img
              src={activeImagePreview}
              alt="Preview"
              className="max-h-72 w-full object-contain mx-auto rounded-xl"
            />
          </div>
        )}

        {/* Attachments List */}
        <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-center text-xs text-stone-400 py-8">Memuat lampiran dan berkas...</p>
          ) : files.length === 0 ? (
            <div className="text-center py-10 space-y-1 text-stone-400">
              <Paperclip className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">Tidak ada file atau dokumen terlampir pada pendaftaran ini.</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {file.is_image ? (
                    <div
                      className="w-14 h-14 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden bg-white shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                      onClick={() => setActiveImagePreview(file.signed_url || null)}
                      title="Klik untuk memperbesar"
                    >
                      <img
                        src={file.signed_url}
                        alt={file.field_label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                      {file.kind === 'pembayaran'
                        ? 'Bukti Pembayaran'
                        : file.kind === 'ttd'
                        ? 'Tanda Tangan Digital'
                        : 'Berkas Pendaftaran'}
                    </span>
                    <h4 className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                      {file.field_label}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-mono truncate max-w-xs">
                      {file.storage_path}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {file.signed_url && (
                    <a
                      href={file.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition-colors"
                    >
                      <span>Buka File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <Button onClick={onClose} variant="festival" size="sm">
            Tutup Galeri
          </Button>
        </div>
      </div>
    </div>
  );
};
