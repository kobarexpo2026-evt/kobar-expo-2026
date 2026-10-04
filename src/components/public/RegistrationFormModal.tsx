import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { formFieldService } from '../../lib/services/formFieldService';
import { FormField, EventItem } from '../../types/database';
import { SignatureCanvas } from './SignatureCanvas';
import { MathCaptcha } from './MathCaptcha';
import { QrisLightboxModal } from './QrisLightboxModal';
import { RegistrationSuccessData } from './RegistrationSuccessModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { formatRupiah } from '../../lib/utils';
import { 
  X, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Users, 
  Lock, 
  AlertCircle, 
  QrCode, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface RegistrationFormModalProps {
  isOpen: boolean;
  event: EventItem | null;
  invitationCode?: string | null;
  onClose: () => void;
  onSuccess: (data: RegistrationSuccessData) => void;
}

export const RegistrationFormModal: React.FC<RegistrationFormModalProps> = ({
  isOpen,
  event,
  invitationCode,
  onClose,
  onSuccess,
}) => {
  // Bagian A: Data Dasar Wajib
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [wa, setWa] = useState('');

  // Bagian B: Field Dinamis
  const [fields, setFields] = useState<FormField[]>([]);
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({});
  const [otherTextValues, setOtherTextValues] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<Record<string, string | null>>({});

  // Security & Captcha
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  // States
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isQrisLightboxOpen, setIsQrisLightboxOpen] = useState(false);

  // Load event dynamic fields
  useEffect(() => {
    if (!isOpen || !event) return;

    const loadFields = async () => {
      setIsLoadingFields(true);
      setErrorMsg(null);
      const loaded = await formFieldService.getFormFields(event.id, 'Pendaftaran');
      setFields(loaded);
      setIsLoadingFields(false);
    };

    loadFields();
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  // Conditional logic for payment method & proof
  const paymentMethodField = fields.find(
    (f) =>
      (f.tipe === 'Dropdown' || f.tipe === 'Radio') &&
      f.label.toLowerCase().includes('pembayaran')
  );

  const paymentProofField = fields.find(
    (f) =>
      (f.tipe === 'File' || f.tipe === 'File Multiple') &&
      f.label.toLowerCase().includes('bukti')
  );

  const selectedPaymentMethod = paymentMethodField ? (dynamicAnswers[paymentMethodField.label] || '').toLowerCase() : '';
  const isCash = selectedPaymentMethod.includes('cash') || selectedPaymentMethod.includes('tunai') || selectedPaymentMethod.includes('langsung');
  const isTransfer = selectedPaymentMethod.includes('transfer') || selectedPaymentMethod.includes('qris') || selectedPaymentMethod.includes('bank') || (selectedPaymentMethod !== '' && !isCash);
  const shouldShowProofAndQris = Boolean(paymentMethodField && isTransfer);

  const handleInputChange = (label: string, value: any) => {
    setDynamicAnswers((prev) => ({ ...prev, [label]: value }));
  };

  const handleCheckboxToggle = (label: string, option: string) => {
    const currentList: string[] = dynamicAnswers[label] || [];
    const updated = currentList.includes(option)
      ? currentList.filter((item) => item !== option)
      : [...currentList, option];
    setDynamicAnswers((prev) => ({ ...prev, [label]: updated }));
  };

  const handleFileUpload = (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Rule: Maksimal 1 MB per file
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 1 * 1024 * 1024) {
        alert(`Ukuran file "${files[i].name}" melebihi batas maksimal 1 MB! Harap gunakan file berukuran di bawah 1 MB.`);
        e.target.value = '';
        return;
      }
    }

    if (files.length === 1) {
      setDynamicAnswers((prev) => ({ ...prev, [label]: files[0].name }));
    } else {
      const names = Array.from(files).map((f) => f.name);
      setDynamicAnswers((prev) => ({ ...prev, [label]: names }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Rate Limiting (prevent double clicking / fast spam under 3 seconds)
    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      setErrorMsg('Mohon tunggu sejenak sebelum mengirim kembali.');
      return;
    }
    setLastSubmitTime(now);

    // Validation: WhatsApp
    const cleanWa = wa.trim().replace(/\D/g, '');
    if (cleanWa.length < 10) {
      setErrorMsg('Nomor WhatsApp tidak valid (minimal 10 digit angka).');
      return;
    }

    // Validation: Captcha
    if (!isCaptchaValid) {
      setErrorMsg('Harap jawab soal matematika captcha dengan benar.');
      return;
    }

    // Merge answers including "Lainnya" and signatures
    const finalAnswers: Record<string, any> = { ...dynamicAnswers };
    Object.keys(otherTextValues).forEach((key) => {
      if (dynamicAnswers[key] === 'Lainnya' || (Array.isArray(dynamicAnswers[key]) && dynamicAnswers[key].includes('Lainnya'))) {
        finalAnswers[`${key}_lainnya`] = otherTextValues[key];
      }
    });
    Object.keys(signatures).forEach((key) => {
      if (signatures[key]) {
        finalAnswers[key] = '[Tanda Tangan Digital Terlampir]';
      }
    });

    setIsSubmitting(true);

    // Real Supabase submission via atomic RPC
    if (isSupabaseConfigured) {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('submit_registration_atomic', {
          p_event_id: event.id,
          p_nama: nama.trim(),
          p_email: email.trim(),
          p_wa: cleanWa,
          p_answers: finalAnswers,
          p_invitation_code: invitationCode || null,
        });

        if (rpcErr) {
          setErrorMsg(rpcErr.message);
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        onClose();
        onSuccess({
          reg_id: rpcData.reg_id,
          nama: rpcData.nama,
          email: rpcData.email,
          wa: cleanWa,
          status_bayar: rpcData.status_bayar,
          status_lulus: rpcData.status_lulus,
          event_nama: event.nama,
          event_tanggal: event.tanggal,
          event_lokasi: event.lokasi,
          event_harga: event.harga,
          bayar_lanjut: event.bayar_lanjut,
          created_at: new Date().toISOString(),
        });
        return;
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal mengirim pendaftaran.');
        setIsSubmitting(false);
        return;
      }
    }

    // Offline / Preview fallback simulation
    setTimeout(() => {
      const demoRegId = `EVT-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      setIsSubmitting(false);
      onClose();
      onSuccess({
        reg_id: demoRegId,
        nama: nama.trim(),
        email: email.trim(),
        wa: cleanWa,
        status_bayar: event.bayar_lanjut ? 'Belum Bayar' : 'Verifikasi Proses',
        status_lulus: 'Belum Lulus',
        event_nama: event.nama,
        event_tanggal: event.tanggal,
        event_lokasi: event.lokasi,
        event_harga: event.harga,
        bayar_lanjut: event.bayar_lanjut,
        created_at: new Date().toISOString(),
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8 bg-festival-sand dark:bg-[#1C1612] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-850 flex items-center justify-between bg-white/80 dark:bg-[#201813]/80 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                Formulir Pendaftaran Peserta
              </h3>
              <p className="text-[11px] text-stone-500 font-baloo truncate max-w-[200px] sm:max-w-sm">
                {event.nama}
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

        {/* Form Body Container */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Event Brief Header */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#241B15] border border-stone-200 dark:border-stone-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="festival-ribbon text-[10px] bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full font-bold">
                KOBAR EXPO 2026
              </span>
              <span className="font-fredoka font-bold text-sm text-teal-600 dark:text-teal-400">
                Biaya: {formatRupiah(event.harga)}
              </span>
            </div>
            <h4 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100">
              {event.nama}
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-baloo">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                {event.tanggal}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {event.lokasi}
              </span>
              {invitationCode && (
                <span className="flex items-center gap-1 text-amber-600 font-mono font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  Kode: {invitationCode}
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-baloo flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BAGIAN A: Data Dasar (Wajib Sistem) */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#241B15] border-2 border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-4 font-baloo">
            <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-fredoka font-bold text-xs flex items-center justify-center">
                A
              </span>
              <h3 className="font-fredoka font-bold text-sm text-stone-900 dark:text-stone-100">
                Data Dasar Peserta
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Nama Lengkap / Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="Contoh: Rian Pratama / Sanggar Tingang"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                    Alamat Email Aktif <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="rian@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    helperText="1 email hanya boleh terdaftar 1 kali per event."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="081234567890"
                    value={wa}
                    onChange={(e) => setWa(e.target.value)}
                    required
                    helperText="Untuk konfirmasi tanda terima tiket."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BAGIAN B: Field Dinamis Form Builder */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#241B15] border-2 border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-5 font-baloo">
            <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-fredoka font-bold text-xs flex items-center justify-center">
                B
              </span>
              <h3 className="font-fredoka font-bold text-sm text-stone-900 dark:text-stone-100">
                Informasi Tambahan Kegiatan
              </h3>
            </div>

            {isLoadingFields ? (
              <p className="text-center text-xs text-stone-400 py-6">Memuat formulir...</p>
            ) : fields.length === 0 ? (
              <p className="text-center text-xs text-stone-400 py-4">
                Tidak ada data tambahan yang disyaratkan untuk event ini.
              </p>
            ) : (
              fields.map((f) => {
                const isProofField = paymentProofField && f.id === paymentProofField.id;
                if (isProofField && !shouldShowProofAndQris) {
                  return null;
                }

                const optionsList = (f.options || '').split('\n').map((opt) => opt.trim()).filter(Boolean);

                return (
                  <div key={f.id} className="space-y-1.5 text-xs">
                    {/* Tipe Judul */}
                    {f.tipe === 'Judul' && (
                      <div className="pt-2 pb-1 space-y-1 border-b border-stone-100 dark:border-stone-850">
                        <h4 className="font-fredoka font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                          {f.label}
                        </h4>
                        {f.options && (
                          <div
                            className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-baloo"
                            dangerouslySetInnerHTML={{ __html: f.options }}
                          />
                        )}
                      </div>
                    )}

                    {/* Tipe Link */}
                    {f.tipe === 'Link' && (
                      <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 flex items-center justify-between">
                        <span className="text-xs font-semibold text-sky-900 dark:text-sky-200 font-baloo">
                          {f.label}
                        </span>
                        <a
                          href={f.options || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold"
                        >
                          <span>Buka Tautan</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Tipe Gambar */}
                    {f.tipe === 'Gambar' && f.options && (
                      <div className="space-y-1">
                        <p className="font-semibold text-stone-700 dark:text-stone-300">{f.label}</p>
                        <img
                          src={f.options}
                          alt={f.label}
                          className="max-h-48 w-full object-contain rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900"
                        />
                      </div>
                    )}

                    {/* Tipe Standar */}
                    {!['Judul', 'Link', 'Gambar', 'Dropdown', 'Radio', 'Checkbox', 'File', 'File Multiple', 'Signature'].includes(f.tipe) && (
                      <div>
                        <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        {f.tipe === 'Textarea' ? (
                          <textarea
                            rows={3}
                            placeholder="Isikan jawaban Anda..."
                            value={dynamicAnswers[f.label] || ''}
                            onChange={(e) => handleInputChange(f.label, e.target.value)}
                            required={f.required}
                            className="w-full p-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-baloo focus:outline-none focus:border-amber-500"
                          />
                        ) : (
                          <Input
                            type={f.tipe === 'Number' ? 'number' : f.tipe === 'Date' ? 'date' : f.tipe === 'Email' ? 'email' : 'text'}
                            placeholder="Isikan jawaban..."
                            value={dynamicAnswers[f.label] || ''}
                            onChange={(e) => handleInputChange(f.label, e.target.value)}
                            required={f.required}
                          />
                        )}
                      </div>
                    )}

                    {/* Dropdown with Lainnya */}
                    {f.tipe === 'Dropdown' && (
                      <div>
                        <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        <select
                          value={dynamicAnswers[f.label] || ''}
                          onChange={(e) => handleInputChange(f.label, e.target.value)}
                          required={f.required}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-baloo focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Pilih salah satu opsi --</option>
                          {optionsList.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>

                        {dynamicAnswers[f.label] === 'Lainnya' && (
                          <Input
                            placeholder="Sebutkan pilihan lainnya..."
                            value={otherTextValues[f.label] || ''}
                            onChange={(e) => setOtherTextValues({ ...otherTextValues, [f.label]: e.target.value })}
                            required
                            className="mt-2 bg-amber-50/50 dark:bg-amber-950/30"
                          />
                        )}
                      </div>
                    )}

                    {/* Radio with Lainnya */}
                    {f.tipe === 'Radio' && (
                      <div>
                        <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="space-y-1.5">
                          {optionsList.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                              <input
                                type="radio"
                                name={`radio-${f.id}`}
                                value={opt}
                                checked={dynamicAnswers[f.label] === opt}
                                onChange={() => handleInputChange(f.label, opt)}
                                className="text-amber-500 focus:ring-amber-400"
                                required={f.required}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>

                        {dynamicAnswers[f.label] === 'Lainnya' && (
                          <Input
                            placeholder="Sebutkan pilihan lainnya..."
                            value={otherTextValues[f.label] || ''}
                            onChange={(e) => setOtherTextValues({ ...otherTextValues, [f.label]: e.target.value })}
                            required
                            className="mt-2 bg-amber-50/50 dark:bg-amber-950/30"
                          />
                        )}
                      </div>
                    )}

                    {/* Checkbox with Lainnya */}
                    {f.tipe === 'Checkbox' && (
                      <div>
                        <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
                          {f.label} {f.required && <span className="text-rose-500">* (Pilih minimal satu)</span>}
                        </label>
                        <div className="space-y-1.5">
                          {optionsList.map((opt, i) => {
                            const isChecked = (dynamicAnswers[f.label] || []).includes(opt);
                            return (
                              <label key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleCheckboxToggle(f.label, opt)}
                                  className="rounded text-amber-500 focus:ring-amber-400"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>

                        {(dynamicAnswers[f.label] || []).includes('Lainnya') && (
                          <Input
                            placeholder="Sebutkan pilihan lainnya..."
                            value={otherTextValues[f.label] || ''}
                            onChange={(e) => setOtherTextValues({ ...otherTextValues, [f.label]: e.target.value })}
                            required
                            className="mt-2 bg-amber-50/50 dark:bg-amber-950/30"
                          />
                        )}
                      </div>
                    )}

                    {/* File & File Multiple Upload */}
                    {(f.tipe === 'File' || f.tipe === 'File Multiple') && (
                      <div>
                        <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                          {f.label} {f.required && <span className="text-rose-500">* (Batas maks 1 MB per file)</span>}
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple={f.tipe === 'File Multiple'}
                          onChange={(e) => handleFileUpload(f.label, e)}
                          required={f.required && !dynamicAnswers[f.label]}
                          className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-950/40 dark:file:text-amber-300"
                        />
                      </div>
                    )}

                    {/* Signature with Statement */}
                    {f.tipe === 'Signature' && (
                      <SignatureCanvas
                        statement={f.options}
                        onSignatureChange={(sig) => setSignatures((prev) => ({ ...prev, [f.label]: sig }))}
                        required={f.required}
                      />
                    )}

                    {/* QRIS Display (Conditional on payment method) */}
                    {f === paymentMethodField && shouldShowProofAndQris && event.qris_url && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 text-center space-y-2">
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200 font-fredoka flex items-center justify-center gap-1">
                          <QrCode className="w-4 h-4" />
                          Kode QRIS Resmi Pembayaran
                        </p>
                        <img
                          src={event.qris_url}
                          alt="QRIS"
                          className="w-40 h-40 object-contain mx-auto bg-white p-2 rounded-xl shadow-xs cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setIsQrisLightboxOpen(true)}
                          title="Klik untuk memperbesar QRIS"
                        />
                        <button
                          type="button"
                          onClick={() => setIsQrisLightboxOpen(true)}
                          className="text-[11px] text-amber-700 dark:text-amber-300 underline font-semibold cursor-pointer"
                        >
                          Klik gambar untuk memperbesar / unduh QRIS
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Math Captcha Anti-Bot Verification */}
          <MathCaptcha onValidated={setIsCaptchaValid} />

          {/* Submit Action Bar */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
            <Button type="button" onClick={onClose} variant="ghost" size="sm">
              Batal
            </Button>
            <Button
              type="submit"
              variant="festival"
              size="md"
              isLoading={isSubmitting}
              className="px-6 font-bold shadow-md"
            >
              <span>Kirim Pendaftaran Resmi</span>
            </Button>
          </div>
        </form>

        {/* QRIS Lightbox */}
        <QrisLightboxModal
          isOpen={isQrisLightboxOpen}
          qrisUrl={event.qris_url}
          eventName={event.nama}
          onClose={() => setIsQrisLightboxOpen(false)}
        />
      </div>
    </div>
  );
};
