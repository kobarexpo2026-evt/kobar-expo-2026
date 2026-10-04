import React, { useState } from 'react';
import { FormField, EventItem } from '../../../types/database';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { 
  X, 
  Eye, 
  ExternalLink, 
  Upload, 
  PenTool, 
  AlertCircle, 
  QrCode, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface FormLivePreviewModalProps {
  isOpen: boolean;
  event: EventItem | null;
  formType: 'Pendaftaran' | 'Pembayaran';
  fields: FormField[];
  onClose: () => void;
}

export const FormLivePreviewModal: React.FC<FormLivePreviewModalProps> = ({
  isOpen,
  event,
  formType,
  fields,
  onClose,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [otherTextValues, setOtherTextValues] = useState<Record<string, string>>({});

  if (!isOpen || !event) return null;

  // Filter valid fields with labels
  const activeFields = fields.filter((f) => f.label && f.label.trim() !== '');

  // Detect payment method field and proof field for conditional logic
  const paymentMethodField = activeFields.find(
    (f) =>
      (f.tipe === 'Dropdown' || f.tipe === 'Radio') &&
      f.label.toLowerCase().includes('pembayaran')
  );

  const paymentProofField = activeFields.find(
    (f) =>
      (f.tipe === 'File' || f.tipe === 'File Multiple') &&
      f.label.toLowerCase().includes('bukti')
  );

  const selectedPaymentMethod = paymentMethodField ? (formData[paymentMethodField.label] || '').toLowerCase() : '';
  
  // Conditional rules:
  // - cash / tunai / langsung: hide proof & QRIS
  // - transfer / qris / bank: show proof & QRIS
  // - not selected yet: hide both
  const isCashPayment = selectedPaymentMethod.includes('cash') || 
                        selectedPaymentMethod.includes('tunai') || 
                        selectedPaymentMethod.includes('langsung');

  const isTransferPayment = selectedPaymentMethod.includes('transfer') || 
                            selectedPaymentMethod.includes('qris') || 
                            selectedPaymentMethod.includes('bank') ||
                            (selectedPaymentMethod !== '' && !isCashPayment);

  const shouldShowProofAndQris = Boolean(paymentMethodField && isTransferPayment);

  const handleInputChange = (label: string, value: any) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const handleCheckboxToggle = (label: string, option: string) => {
    const currentList: string[] = formData[label] || [];
    const updated = currentList.includes(option)
      ? currentList.filter((item) => item !== option)
      : [...currentList, option];
    setFormData((prev) => ({ ...prev, [label]: updated }));
  };

  const renderRichText = (html: string) => {
    // Basic sanitization allowing only <b>, <i>, <u>, <br>, <p>, <strong>, <em>
    return { __html: html };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8 bg-festival-sand dark:bg-[#1C1612] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-850 flex items-center justify-between bg-white/80 dark:bg-[#201813]/80 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fredoka font-bold text-base md:text-lg text-stone-900 dark:text-stone-100">
                  Pratinjau Langsung (Live Preview)
                </h3>
                <Badge variant="festival" className="text-[10px]">
                  {formType === 'Pendaftaran' ? 'FORMULIR PENDAFTARAN' : 'FORM PEMBAYARAN LANJUTAN'}
                </Badge>
              </div>
              <p className="text-xs text-stone-500 font-baloo truncate max-w-sm">
                Event: {event.nama}
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

        {/* Scrollable Simulated Form Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Banner & Title Header in Festival Style */}
          <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#241B15] shadow-xs">
            {event.banner_url && (
              <img
                src={event.banner_url}
                alt=""
                className="w-full h-36 object-cover"
              />
            )}
            <div className="p-4 space-y-1">
              <span className="festival-ribbon text-[10px] bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full">
                Simulasi Tampilan Peserta
              </span>
              <h2 className="font-fredoka font-bold text-xl text-stone-900 dark:text-stone-100">
                {formType === 'Pendaftaran' ? `Formulir Registrasi: ${event.nama}` : `Konfirmasi Pembayaran Sewa: ${event.nama}`}
              </h2>
              <p className="text-xs text-stone-500 font-baloo">
                {event.tanggal} &bull; {event.lokasi}
              </p>
            </div>
          </div>

          {/* BAGIAN A: Data Dasar (Hanya pada Form Pendaftaran) */}
          {formType === 'Pendaftaran' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#241B15] border-2 border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-fredoka font-bold text-xs flex items-center justify-center">
                  A
                </span>
                <h3 className="font-fredoka font-bold text-sm text-stone-900 dark:text-stone-100">
                  Data Dasar Peserta (Wajib Sistem)
                </h3>
              </div>

              <div className="space-y-3 font-baloo">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                    Nama Lengkap / Penanggung Jawab <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rian Pratama"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      Alamat Email Aktif <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="rian@example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      Nomor WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="081234567890"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BAGIAN B: Field Dinamis Hasil Desain Form Builder */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#241B15] border-2 border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-5">
            <div className="flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-fredoka font-bold text-xs flex items-center justify-center">
                {formType === 'Pendaftaran' ? 'B' : '1'}
              </span>
              <h3 className="font-fredoka font-bold text-sm text-stone-900 dark:text-stone-100">
                {formType === 'Pendaftaran' ? 'Informasi Tambahan Kegiatan' : 'Rincian Formulir Pembayaran Lanjutan'}
              </h3>
            </div>

            {activeFields.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs font-baloo">
                Belum ada field formulir yang ditambahkan. Gunakan tombol "Tambah Field Baru" pada editor.
              </div>
            ) : (
              activeFields.map((f) => {
                // Conditional logic: check if this is the proof upload field
                const isProofField = paymentProofField && f.id === paymentProofField.id;
                if (isProofField && !shouldShowProofAndQris) {
                  return null; // Hidden based on conditional payment rule!
                }

                const optionsList = (f.options || '')
                  .split('\n')
                  .map((opt) => opt.trim())
                  .filter(Boolean);

                return (
                  <div key={f.id} className="space-y-1.5 font-baloo">
                    {/* Field Type: Judul */}
                    {f.tipe === 'Judul' && (
                      <div className="pt-2 pb-1 space-y-1 border-b border-stone-100 dark:border-stone-850">
                        <h4 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100">
                          {f.label}
                        </h4>
                        {f.options && (
                          <div
                            className="text-xs text-stone-600 dark:text-stone-400 font-baloo leading-relaxed"
                            dangerouslySetInnerHTML={renderRichText(f.options)}
                          />
                        )}
                      </div>
                    )}

                    {/* Field Type: Link */}
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

                    {/* Field Type: Gambar */}
                    {f.tipe === 'Gambar' && f.options && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">{f.label}</p>
                        <img
                          src={f.options}
                          alt={f.label}
                          className="max-h-48 w-full object-contain rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900"
                        />
                      </div>
                    )}

                    {/* Standard Inputs: Text, Number, Email, Date, Textarea */}
                    {!['Judul', 'Link', 'Gambar', 'Dropdown', 'Radio', 'Checkbox', 'File', 'File Multiple', 'Signature'].includes(f.tipe) && (
                      <div>
                        <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        {f.tipe === 'Textarea' ? (
                          <textarea
                            rows={3}
                            placeholder="Tuliskan jawaban Anda di sini..."
                            value={formData[f.label] || ''}
                            onChange={(e) => handleInputChange(f.label, e.target.value)}
                            className="w-full mt-1 p-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500"
                          />
                        ) : (
                          <input
                            type={f.tipe === 'Number' ? 'number' : f.tipe === 'Date' ? 'date' : f.tipe === 'Email' ? 'email' : 'text'}
                            placeholder="Isikan jawaban..."
                            value={formData[f.label] || ''}
                            onChange={(e) => handleInputChange(f.label, e.target.value)}
                            className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500"
                          />
                        )}
                      </div>
                    )}

                    {/* Dropdown with Lainnya */}
                    {f.tipe === 'Dropdown' && (
                      <div>
                        <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        <select
                          value={formData[f.label] || ''}
                          onChange={(e) => handleInputChange(f.label, e.target.value)}
                          className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200"
                        >
                          <option value="">-- Pilih opsi --</option>
                          {optionsList.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>

                        {/* Free text input if 'Lainnya' selected */}
                        {formData[f.label] === 'Lainnya' && (
                          <input
                            type="text"
                            placeholder="Sebutkan pilihan lainnya..."
                            value={otherTextValues[f.label] || ''}
                            onChange={(e) => setOtherTextValues({ ...otherTextValues, [f.label]: e.target.value })}
                            className="w-full mt-2 px-3 py-2 text-xs rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800"
                          />
                        )}
                      </div>
                    )}

                    {/* Radio with Lainnya */}
                    {f.tipe === 'Radio' && (
                      <div>
                        <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="space-y-1.5">
                          {optionsList.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
                              <input
                                type="radio"
                                name={`radio-${f.id}`}
                                value={opt}
                                checked={formData[f.label] === opt}
                                onChange={() => handleInputChange(f.label, opt)}
                                className="text-amber-500 focus:ring-amber-400"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>

                        {formData[f.label] === 'Lainnya' && (
                          <input
                            type="text"
                            placeholder="Sebutkan pilihan lainnya..."
                            value={otherTextValues[f.label] || ''}
                            onChange={(e) => setOtherTextValues({ ...otherTextValues, [f.label]: e.target.value })}
                            className="w-full mt-2 px-3 py-2 text-xs rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800"
                          />
                        )}
                      </div>
                    )}

                    {/* Checkbox with Lainnya */}
                    {f.tipe === 'Checkbox' && (
                      <div>
                        <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                          {f.label} {f.required && <span className="text-rose-500">* (Pilih minimal 1)</span>}
                        </label>
                        <div className="space-y-1.5">
                          {optionsList.map((opt, i) => {
                            const isChecked = (formData[f.label] || []).includes(opt);
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

                        {(formData[f.label] || []).includes('Lainnya') && (
                          <input
                            type="text"
                            placeholder="Sebutkan pilihan lainnya..."
                            value={otherTextValues[f.label] || ''}
                            onChange={(e) => setOtherTextValues({ ...otherTextValues, [f.label]: e.target.value })}
                            className="w-full mt-2 px-3 py-2 text-xs rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800"
                          />
                        )}
                      </div>
                    )}

                    {/* File & File Multiple Upload */}
                    {(f.tipe === 'File' || f.tipe === 'File Multiple') && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 text-center space-y-1 bg-stone-50/50 dark:bg-stone-900/30">
                          <Upload className="w-5 h-5 mx-auto text-stone-400" />
                          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                            {f.tipe === 'File Multiple' ? 'Klik untuk memilih satu atau beberapa file' : 'Klik untuk memilih 1 file'}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            Format PDF, JPG, PNG &bull; Maksimal 1 MB per file
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Signature with Statement */}
                    {f.tipe === 'Signature' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>

                        {/* Statement Box */}
                        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-stone-700 dark:text-stone-300 italic">
                          "{f.options || 'Saya menyatakan siap mematuhi tata tertib acara ini.'}"
                        </div>

                        {/* Signature Canvas Area Placeholder */}
                        <div className="h-28 rounded-xl border-2 border-dashed border-teal-400 dark:border-teal-800 bg-white dark:bg-stone-900 flex flex-col items-center justify-center text-stone-400 text-xs gap-1">
                          <PenTool className="w-5 h-5 text-teal-600" />
                          <span>Area Tanda Tangan Digital (Kanvas Sentuh / Mouse)</span>
                        </div>
                      </div>
                    )}

                    {/* QRIS Display (Conditional on payment method) */}
                    {f === paymentMethodField && shouldShowProofAndQris && event.qris_url && (
                      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800/80 space-y-2 text-center animate-in fade-in duration-200">
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-1.5 font-fredoka">
                          <QrCode className="w-4 h-4 text-amber-600" />
                          Kode QRIS Resmi Pembayaran KOBAR EXPO
                        </p>
                        <img
                          src={event.qris_url}
                          alt="QRIS"
                          className="w-44 h-44 object-contain mx-auto bg-white p-2 rounded-xl shadow-xs"
                        />
                        <p className="text-[11px] text-stone-600 dark:text-stone-400">
                          Pindai kode QRIS di atas melalui m-Banking atau e-Wallet, lalu unggah bukti transfer di bawah.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Simulative Submit Button */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
              <Button variant="festival" className="w-full py-3" onClick={() => alert('Ini adalah tampilan simulasi pratinjau langsung!')}>
                {formType === 'Pendaftaran' ? 'Kirim Pendaftaran (Simulasi)' : 'Kirim Bukti Pembayaran (Simulasi)'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-850 flex justify-end bg-white/60 dark:bg-[#201813]/60 shrink-0">
          <Button onClick={onClose} variant="ghost" size="sm">
            Tutup Pratinjau
          </Button>
        </div>
      </div>
    </div>
  );
};
