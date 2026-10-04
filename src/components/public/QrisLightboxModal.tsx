import React from 'react';
import { X, Download, QrCode, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface QrisLightboxModalProps {
  isOpen: boolean;
  qrisUrl: string | null;
  eventName: string;
  onClose: () => void;
}

export const QrisLightboxModal: React.FC<QrisLightboxModalProps> = ({
  isOpen,
  qrisUrl,
  eventName,
  onClose,
}) => {
  if (!isOpen || !qrisUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrisUrl;
    link.download = `QRIS-KobarExpo-${eventName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#201813] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4 text-center">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </span>
            <div className="text-left">
              <h3 className="font-fredoka font-bold text-sm text-stone-900 dark:text-stone-100">
                Pindai QRIS Pembayaran
              </h3>
              <p className="text-[11px] text-stone-500 font-baloo truncate max-w-[200px]">
                {eventName}
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

        {/* QRIS Image Container */}
        <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 shadow-inner flex items-center justify-center">
          <img
            src={qrisUrl}
            alt="QRIS Kobar Expo"
            className="max-h-72 w-full object-contain mx-auto"
          />
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 font-baloo">
          Mendukung seluruh aplikasi m-Banking (BCA, Mandiri, BRI, BNI, Bank Kalteng) dan Dompet Digital (Dana, OVO, GoPay, LinkAja, ShopeePay).
        </p>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={handleDownload} variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1" />
            Unduh QRIS
          </Button>
          <Button onClick={onClose} variant="festival" size="sm" className="text-xs">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};
