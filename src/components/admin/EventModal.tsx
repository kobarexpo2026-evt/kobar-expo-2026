import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EventItem, EventStatus, AccessMode } from '../../types/database';
import { eventService } from '../../lib/services/eventService';
import { X, Upload, Image, AlertCircle, Sparkles, QrCode } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
  onSaved: () => void;
  isSuperAdmin: boolean;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSaved,
  isSuperAdmin,
}) => {
  const [nama, setNama] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [status, setStatus] = useState<EventStatus>('Buka');
  const [kuota, setKuota] = useState<string>('');
  const [harga, setHarga] = useState<string>('0');
  const [bayarLanjut, setBayarLanjut] = useState<boolean>(false);
  const [modeAkses, setModeAkses] = useState<AccessMode>('Publik');
  
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [qrisUrl, setQrisUrl] = useState<string>('');
  
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setNama(event.nama);
      setTanggal(event.tanggal);
      setLokasi(event.lokasi);
      setStatus(event.status);
      setKuota(event.kuota !== null && event.kuota !== undefined ? String(event.kuota) : '');
      setHarga(String(event.harga || 0));
      setBayarLanjut(Boolean(event.bayar_lanjut));
      setModeAkses(event.mode_akses);
      setBannerUrl(event.banner_url || '');
      setQrisUrl(event.qris_url || '');
    } else {
      setNama('');
      setTanggal('');
      setLokasi('Pangkalan Bun, Kotawaringin Barat');
      setStatus('Buka');
      setKuota('');
      setHarga('0');
      setBayarLanjut(false);
      setModeAkses('Publik');
      setBannerUrl('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80');
      setQrisUrl('');
    }
    setErrorMsg(null);
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    const res = await eventService.uploadAssetFile(file, 'banners');
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.url) {
      setBannerUrl(res.url);
    }
    setIsUploadingBanner(false);
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingQris(true);
    const res = await eventService.uploadAssetFile(file, 'qris');
    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.url) {
      setQrisUrl(res.url);
    }
    setIsUploadingQris(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama.trim() || !tanggal.trim() || !lokasi.trim()) {
      setErrorMsg('Nama, tanggal, dan lokasi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const res = await eventService.saveEvent(
      {
        id: event?.id,
        nama: nama.trim(),
        tanggal: tanggal.trim(),
        lokasi: lokasi.trim(),
        status,
        kuota: kuota.trim() === '' ? null : parseInt(kuota, 10),
        harga: parseFloat(harga) || 0,
        bayar_lanjut: bayarLanjut,
        mode_akses: modeAkses,
        banner_url: bannerUrl.trim() || null,
        qris_url: qrisUrl.trim() || null,
      },
      isSuperAdmin
    );

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8 bg-white dark:bg-[#201813] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-lg text-stone-900 dark:text-stone-100">
                {event ? 'Edit Agenda Event' : 'Tambah Event Baru'}
              </h3>
              <p className="text-xs text-stone-500 font-baloo">
                KOBAR EXPO 2026 &bull; Form Pengaturan Event Resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nama Event */}
          <Input
            label="Nama Event / Kegiatan"
            placeholder="Contoh: Lomba Dayung Tradisional Batang Arut"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />

          {/* Grid Tanggal & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Pelaksanaan"
              placeholder="Contoh: 15 - 18 Mei 2026"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
            <Input
              label="Lokasi Acara"
              placeholder="Contoh: Lapangan Sampuraga / Boulevard"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              required
            />
          </div>

          {/* Grid Status, Kuota, Harga */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 font-baloo mb-1.5">
                Status Event
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 font-baloo text-stone-900 dark:text-stone-100"
              >
                <option value="Buka">Buka (Pendaftaran Aktif)</option>
                <option value="Tutup">Tutup (Nonaktif/Ditutup)</option>
                <option value="Draft">Draft (Hanya Admin)</option>
              </select>
            </div>

            <Input
              label="Kuota Peserta"
              type="number"
              min="1"
              placeholder="Kosongkan jika tak terbatas"
              value={kuota}
              onChange={(e) => setKuota(e.target.value)}
              helperText="Biarkan kosong jika tanpa batasan kuota"
            />

            <Input
              label="Biaya Pendaftaran (Rp)"
              type="number"
              min="0"
              step="1000"
              placeholder="0 (Gratis)"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              helperText="Isi 0 jika pendaftaran gratis"
            />
          </div>

          {/* Options: Mode Akses & Bayar Lanjutan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            {/* Mode Akses */}
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 font-baloo mb-1.5">
                Mode Akses Pendaftaran
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModeAkses('Publik')}
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    modeAkses === 'Publik'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600'
                  }`}
                >
                  Publik (Terbuka Umum)
                </button>
                <button
                  type="button"
                  onClick={() => setModeAkses('Undangan')}
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    modeAkses === 'Undangan'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600'
                  }`}
                >
                  Undangan (Wajib Kode)
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-1 font-baloo">
                Mode Undangan memerlukan kode khusus yang diverifikasi dan dikonsumsi saat mendaftar.
              </p>
            </div>

            {/* Bayar Lanjut */}
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 font-baloo mb-1.5">
                Alur Pembayaran Lanjutan
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBayarLanjut(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    !bayarLanjut
                      ? 'border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600'
                  }`}
                >
                  Tidak (Langsung Verifikasi)
                </button>
                <button
                  type="button"
                  onClick={() => setBayarLanjut(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    bayarLanjut
                      ? 'border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200'
                      : 'border-stone-200 dark:border-stone-800 text-stone-600'
                  }`}
                >
                  Ya (Form Terpisah)
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-1 font-baloo">
                Cocok untuk seleksi booth/UMKM: bayar dilakukan setelah status kurasi dinyatakan <strong>Lulus</strong>.
              </p>
            </div>
          </div>

          {/* Banner & QRIS Upload Sections */}
          <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            {/* Banner Event */}
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 font-baloo mb-1">
                Banner Event (Gambar)
              </label>
              <div className="flex items-center gap-3">
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    className="w-20 h-12 object-cover rounded-xl border border-stone-200 dark:border-stone-800 shrink-0"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="URL gambar banner..."
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                </div>
                <label className="shrink-0 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                    disabled={isUploadingBanner}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-semibold text-stone-700 dark:text-stone-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingBanner ? 'Mengunggah...' : 'Upload'}</span>
                  </span>
                </label>
              </div>
            </div>

            {/* QRIS Event */}
            <div>
              <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 font-baloo mb-1">
                Gambar QRIS Pembayaran (Opsional)
              </label>
              <div className="flex items-center gap-3">
                {qrisUrl && (
                  <img
                    src={qrisUrl}
                    alt="QRIS preview"
                    className="w-12 h-12 object-contain bg-white rounded-xl border border-stone-200 dark:border-stone-800 shrink-0 p-1"
                  />
                )}
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="URL gambar QRIS..."
                    value={qrisUrl}
                    onChange={(e) => setQrisUrl(e.target.value)}
                  />
                </div>
                <label className="shrink-0 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrisUpload}
                    className="hidden"
                    disabled={isUploadingQris}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-semibold text-stone-700 dark:text-stone-200">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{isUploadingQris ? 'Mengunggah...' : 'Upload QRIS'}</span>
                  </span>
                </label>
              </div>
              <p className="text-[11px] text-stone-400 mt-1 font-baloo">
                Jika diisi, QRIS otomatis ditampilkan saat peserta memilih metode bayar Transfer/QRIS.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="festival" isLoading={isSubmitting}>
              {event ? 'Simpan Perubahan' : 'Buat Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
