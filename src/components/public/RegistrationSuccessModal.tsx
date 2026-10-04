import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  CheckCircle2, 
  Download, 
  Copy, 
  Check, 
  Calendar, 
  MapPin, 
  User, 
  QrCode, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '../../lib/utils';

export interface RegistrationSuccessData {
  reg_id: string;
  nama: string;
  email: string;
  wa: string;
  status_bayar: string;
  status_lulus: string;
  event_nama: string;
  event_tanggal: string;
  event_lokasi: string;
  event_harga: number;
  bayar_lanjut: boolean;
  created_at: string;
}

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  data: RegistrationSuccessData | null;
  onClose: () => void;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  isOpen,
  data,
  onClose,
}) => {
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !data) return null;

  const handleCopyRegId = () => {
    navigator.clipboard.writeText(data.reg_id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTicketPng = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);

    try {
      // Generate clean PNG image from the styled ticket DOM
      // skipFonts: true and fontEmbedCSS: '' prevent reading cross-origin fonts from Google Fonts
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
        quality: 0.95,
        backgroundColor: '#FFFDF7',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `Tiket-KobarExpo-${data.reg_id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG ticket:', err);
      alert('Gagal menghasilkan file gambar tiket. Silakan screenshot tiket Anda.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full my-8 bg-white dark:bg-[#1E1712] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5">
        
        {/* Success Icon & Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-fredoka font-bold text-xl text-stone-900 dark:text-stone-100">
            Pendaftaran Berhasil Dikirim!
          </h3>
          <p className="text-xs text-stone-500 font-baloo">
            Simpan tiket bukti pendaftaran dan nomor registrasi unik Anda di bawah ini.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* TIKET RESMI KOBAR EXPO (Elemen ini yang dikonversi menjadi gambar PNG) */}
        {/* ========================================================================= */}
        <div
          ref={ticketRef}
          className="p-5 rounded-3xl border-2 border-amber-300 dark:border-amber-800/80 bg-[#FFFDF7] dark:bg-[#241B15] text-stone-900 dark:text-stone-100 space-y-4 shadow-md relative overflow-hidden font-baloo"
        >
          {/* Decorative Corner Ribbon */}
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
            <div className="bg-amber-500 text-white font-fredoka font-bold text-[9px] py-1 text-center rotate-45 transform translate-x-7 translate-y-3 shadow-xs uppercase tracking-wider">
              Resmi 2026
            </div>
          </div>

          {/* Ticket Header */}
          <div className="flex items-center gap-3 border-b border-amber-200/80 dark:border-stone-800 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-teal-600 flex items-center justify-center text-white font-fredoka font-bold text-lg shadow-sm">
              K
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-fredoka font-bold text-base tracking-wide text-stone-900 dark:text-stone-100">
                  KOBAR EXPO 2026
                </span>
              </div>
              <p className="text-[10px] text-stone-500">
                Tanda Terima Pendaftaran Peserta Resmi
              </p>
            </div>
          </div>

          {/* Registration Number Box */}
          <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-900 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest font-fredoka">
              Nomor Registrasi Unik
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-amber-600 dark:text-amber-300">
              {data.reg_id}
            </div>
          </div>

          {/* Participant & Event Info Grid */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 dark:border-stone-850 pb-1.5">
              <span className="text-stone-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-500" />
                Nama Peserta
              </span>
              <span className="font-bold text-right text-stone-800 dark:text-stone-200">
                {data.nama}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 dark:border-stone-850 pb-1.5">
              <span className="text-stone-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Kegiatan / Event
              </span>
              <span className="font-bold text-right text-stone-800 dark:text-stone-200 max-w-[200px] truncate">
                {data.event_nama}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 dark:border-stone-850 pb-1.5">
              <span className="text-stone-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Lokasi
              </span>
              <span className="text-right text-stone-700 dark:text-stone-300 max-w-[200px] truncate">
                {data.event_lokasi}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div>
                <span className="text-[10px] text-stone-400 block">Status Pembayaran</span>
                <Badge
                  variant={
                    data.status_bayar === 'Lunas'
                      ? 'success'
                      : data.status_bayar === 'Verifikasi Proses'
                      ? 'warning'
                      : 'danger'
                  }
                  className="text-[10px]"
                >
                  {data.status_bayar}
                </Badge>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 block">Biaya Terdaftar</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {formatRupiah(data.event_harga)}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Footer / Barcode decoration */}
          <div className="pt-2 border-t-2 border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-between text-[10px] text-stone-400">
            <span className="font-mono">Waktu Daftar: {formatDateIndo(data.created_at).split(',')[0]}</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Terverifikasi Sistem
            </span>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="space-y-2 pt-1">
          <Button
            onClick={handleDownloadTicketPng}
            variant="festival"
            className="w-full py-2.5 text-xs shadow-md font-bold"
            isLoading={isDownloading}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Simpan Tiket (PNG)
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleCopyRegId}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {isCopied ? 'Tersalin!' : 'Salin No. Reg'}
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Tutup & Selesai
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
