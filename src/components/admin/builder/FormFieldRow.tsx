import React, { useState } from 'react';
import { FormField, FieldType } from '../../../types/database';
import { TextFormatToolbar } from './TextFormatToolbar';
import { formFieldService } from '../../../lib/services/formFieldService';
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  PenTool, 
  ListPlus,
  HelpCircle,
  Eye
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormFieldRowProps {
  field: FormField;
  index: number;
  onUpdate: (updated: FormField) => void;
  onDuplicate: (field: FormField) => void;
  onDelete: (id: string) => void;
}

const ALL_FIELD_TYPES: { type: FieldType; label: string; group: 'Standar' | 'Pilihan' | 'Lampiran' | 'Dekoratif' }[] = [
  // Standar
  { type: 'Text', label: 'Teks Singkat (Text)', group: 'Standar' },
  { type: 'Textarea', label: 'Teks Paragraf (Textarea)', group: 'Standar' },
  { type: 'Number', label: 'Angka (Number)', group: 'Standar' },
  { type: 'Email', label: 'Email Khusus (Email)', group: 'Standar' },
  { type: 'Date', label: 'Tanggal (Date)', group: 'Standar' },
  
  // Pilihan
  { type: 'Dropdown', label: 'Pilihan Dropdown', group: 'Pilihan' },
  { type: 'Radio', label: 'Pilihan Tunggal (Radio)', group: 'Pilihan' },
  { type: 'Checkbox', label: 'Centang Banyak (Checkbox)', group: 'Pilihan' },
  
  // Lampiran
  { type: 'File', label: 'Upload 1 File (maks 1MB)', group: 'Lampiran' },
  { type: 'File Multiple', label: 'Upload Banyak File', group: 'Lampiran' },
  { type: 'Signature', label: 'Surat & Tanda Tangan (Signature)', group: 'Lampiran' },
  
  // Dekoratif (Tanpa isian nilai)
  { type: 'Judul', label: 'Judul / Deskripsi Teks (Rich Text)', group: 'Dekoratif' },
  { type: 'Link', label: 'Tautan Web (Link)', group: 'Dekoratif' },
  { type: 'Gambar', label: 'Gambar Langsung (Image)', group: 'Dekoratif' },
];

export const FormFieldRow: React.FC<FormFieldRowProps> = ({
  field,
  index,
  onUpdate,
  onDuplicate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isUploading, setIsUploading] = useState(false);
  const isDecorative = field.tipe === 'Judul' || field.tipe === 'Link' || field.tipe === 'Gambar';
  const hasOptionsList = field.tipe === 'Dropdown' || field.tipe === 'Radio' || field.tipe === 'Checkbox';

  const handleAddOptionLainnya = () => {
    const current = (field.options || '').trim();
    if (current.includes('Lainnya')) return;
    const updated = current ? `${current}\nLainnya` : 'Lainnya';
    onUpdate({ ...field, options: updated });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const res = await formFieldService.uploadFieldImage(file);
    setIsUploading(false);

    if (res.error) {
      alert(res.error);
    } else if (res.url) {
      onUpdate({ ...field, options: res.url });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border-2 transition-all p-4 bg-white dark:bg-[#201813] shadow-xs space-y-3 ${
        isDragging
          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 shadow-lg'
          : 'border-stone-200/90 dark:border-stone-850/90 hover:border-amber-300 dark:hover:border-amber-800'
      }`}
    >
      {/* Top Row: Handle, Index, Label, Type, Required, Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        {/* Grip Handle */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-grab active:cursor-grabbing hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Geser untuk mengubah urutan field"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
        </div>

        {/* Label Input */}
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder={
              field.tipe === 'Judul'
                ? 'Judul Bagian / Header...'
                : field.tipe === 'Link'
                ? 'Label Teks Tautan...'
                : 'Label Pertanyaan / Isian (Wajib diisi)...'
            }
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            className="w-full px-3 py-2 text-sm font-semibold rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 font-baloo"
          />
        </div>

        {/* Type Selector */}
        <div className="w-full md:w-56 shrink-0">
          <select
            value={field.tipe}
            onChange={(e) => onUpdate({ ...field, tipe: e.target.value as FieldType })}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-baloo focus:outline-none focus:border-amber-500"
          >
            <optgroup label="Tipe Standar">
              {ALL_FIELD_TYPES.filter((t) => t.group === 'Standar').map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </optgroup>
            <optgroup label="Tipe Pilihan">
              {ALL_FIELD_TYPES.filter((t) => t.group === 'Pilihan').map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </optgroup>
            <optgroup label="Lampiran & TTD">
              {ALL_FIELD_TYPES.filter((t) => t.group === 'Lampiran').map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </optgroup>
            <optgroup label="Dekoratif (Tanpa Input Nilai)">
              {ALL_FIELD_TYPES.filter((t) => t.group === 'Dekoratif').map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Required Toggle (Hidden for decorative types) */}
        {!isDecorative ? (
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 text-xs font-bold font-baloo cursor-pointer shrink-0 select-none">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-400"
            />
            <span className={field.required ? 'text-rose-600 dark:text-rose-400' : 'text-stone-500'}>
              Wajib Isi
            </span>
          </label>
        ) : (
          <span className="text-[11px] font-mono text-stone-400 px-2 py-1 bg-stone-100 dark:bg-stone-850 rounded-lg shrink-0">
            Dekoratif
          </span>
        )}

        {/* Actions: Duplicate & Delete */}
        <div className="flex items-center gap-1 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => onDuplicate(field)}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Duplikasi Field"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(field.id)}
            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Hapus Field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Adaptive Sub-Editors Based on Field Type */}
      
      {/* 1. Dropdown / Radio / Checkbox: Multiline Options */}
      {hasOptionsList && (
        <div className="pl-8 space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 font-baloo">
              Daftar Pilihan Opsi (Satu opsi per baris):
            </label>
            <button
              type="button"
              onClick={handleAddOptionLainnya}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-baloo cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Opsi "Lainnya"</span>
            </button>
          </div>
          <textarea
            rows={3}
            placeholder={"Pilihan A\nPilihan B\nPilihan C\nLainnya"}
            value={field.options || ''}
            onChange={(e) => onUpdate({ ...field, options: e.target.value })}
            className="w-full p-2.5 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500 text-stone-800 dark:text-stone-200"
          />
          <p className="text-[11px] text-stone-400 font-baloo">
            Tip: Opsi bernama <strong>"Lainnya"</strong> otomatis memunculkan kolom isian teks bebas saat dipilih peserta.
          </p>
        </div>
      )}

      {/* 2. Signature: Statement Text */}
      {field.tipe === 'Signature' && (
        <div className="pl-8 space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 font-baloo flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-teal-600" />
            Teks Surat Pernyataan (Tampil di atas kanvas Tanda Tangan):
          </label>
          <textarea
            rows={2}
            placeholder="Dengan ini saya menyatakan bahwa data yang diisikan adalah benar..."
            value={field.options || ''}
            onChange={(e) => onUpdate({ ...field, options: e.target.value })}
            className="w-full p-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500 font-baloo text-stone-800 dark:text-stone-200"
          />
        </div>
      )}

      {/* 3. Judul: Rich Text Toolbar + Description */}
      {field.tipe === 'Judul' && (
        <div className="pl-8 space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 font-baloo">
              Deskripsi / Catatan Petunjuk (Mendukung Format Teks):
            </label>
            <TextFormatToolbar
              textareaId={`desc-${field.id}`}
              value={field.options || ''}
              onChange={(val) => onUpdate({ ...field, options: val })}
            />
          </div>
          <textarea
            id={`desc-${field.id}`}
            rows={2}
            placeholder="Tuliskan petunjuk pengisian atau informasi penting bagi peserta..."
            value={field.options || ''}
            onChange={(e) => onUpdate({ ...field, options: e.target.value })}
            className="w-full p-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500 font-baloo text-stone-800 dark:text-stone-200"
          />
        </div>
      )}

      {/* 4. Link: URL Input */}
      {field.tipe === 'Link' && (
        <div className="pl-8 space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 font-baloo flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-sky-500" />
            Alamat URL Tautan (Link):
          </label>
          <input
            type="url"
            placeholder="https://example.com/panduan-lomba.pdf"
            value={field.options || ''}
            onChange={(e) => onUpdate({ ...field, options: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500 text-stone-800 dark:text-stone-200"
          />
        </div>
      )}

      {/* 5. Gambar: Image Upload + Preview */}
      {field.tipe === 'Gambar' && (
        <div className="pl-8 space-y-2 pt-2 border-t border-stone-100 dark:border-stone-850">
          <label className="text-xs font-semibold text-stone-600 dark:text-stone-400 font-baloo flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
            Gambar Dekoratif (Upload ke Supabase Storage atau masukkan URL):
          </label>
          <div className="flex items-center gap-3">
            {field.options && (
              <img
                src={field.options}
                alt="Preview"
                className="w-16 h-12 object-cover rounded-xl border border-stone-200 dark:border-stone-800 shrink-0"
              />
            )}
            <input
              type="text"
              placeholder="https://... atau klik Upload"
              value={field.options || ''}
              onChange={(e) => onUpdate({ ...field, options: e.target.value })}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500 text-stone-800 dark:text-stone-200"
            />
            <label className="shrink-0 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold hover:bg-stone-100 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Upload...' : 'Upload Gambar'}</span>
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
