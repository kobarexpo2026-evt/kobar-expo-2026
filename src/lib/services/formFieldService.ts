import { supabase, isSupabaseConfigured } from '../supabase/client';
import { FormField, FormType, FieldType } from '../../types/database';

// Default templates for quick population
export const DEFAULT_PENDAFTARAN_FIELDS: Omit<FormField, 'id' | 'event_id' | 'created_at'>[] = [
  {
    form_type: 'Pendaftaran',
    urutan: 1,
    label: 'Informasi Kelompok / Lembaga',
    tipe: 'Judul',
    required: false,
    options: '<b>Petunjuk:</b> Harap mengisi data tim atau instansi dengan benar dan valid.',
  },
  {
    form_type: 'Pendaftaran',
    urutan: 2,
    label: 'Nama Sanggar / Instansi / Brand',
    tipe: 'Text',
    required: true,
    options: null,
  },
  {
    form_type: 'Pendaftaran',
    urutan: 3,
    label: 'Kategori Partisipasi',
    tipe: 'Radio',
    required: true,
    options: 'Pelajar / Mahasiswa\nUmum / Komunitas\nProfesional\nLainnya',
  },
  {
    form_type: 'Pendaftaran',
    urutan: 4,
    label: 'Jumlah Personil',
    tipe: 'Number',
    required: true,
    options: null,
  },
  {
    form_type: 'Pendaftaran',
    urutan: 5,
    label: 'Metode Pembayaran Pendaftaran',
    tipe: 'Dropdown',
    required: true,
    options: 'Transfer Bank Mandiri / QRIS\nTunai di Sekretariat (Cash)',
  },
  {
    form_type: 'Pendaftaran',
    urutan: 6,
    label: 'Bukti Transfer Pembayaran',
    tipe: 'File',
    required: false,
    options: null,
  },
  {
    form_type: 'Pendaftaran',
    urutan: 7,
    label: 'Surat Pernyataan Kesediaan',
    tipe: 'Signature',
    required: true,
    options: 'Dengan ini kami menyatakan siap mematuhi seluruh peraturan dan tata tertib KOBAR EXPO 2026.',
  },
];

export const DEFAULT_PEMBAYARAN_FIELDS: Omit<FormField, 'id' | 'event_id' | 'created_at'>[] = [
  {
    form_type: 'Pembayaran',
    urutan: 1,
    label: 'Instruksi Pembayaran Lanjutan Booth',
    tipe: 'Judul',
    required: false,
    options: '<b>Selamat!</b> Pengajuan booth Anda telah dinyatakan <u>LULUS</u>. Silakan selesaikan pembayaran sewa booth di bawah ini.',
  },
  {
    form_type: 'Pembayaran',
    urutan: 2,
    label: 'Metode Pembayaran Sewa Booth',
    tipe: 'Dropdown',
    required: true,
    options: 'Transfer Bank Kalteng / QRIS\nTunai / Cash di Kantor Dinas Perindagkop',
  },
  {
    form_type: 'Pembayaran',
    urutan: 3,
    label: 'Unggah Bukti Transfer Pembayaran Booth',
    tipe: 'File',
    required: true,
    options: null,
  },
  {
    form_type: 'Pembayaran',
    urutan: 4,
    label: 'Kebutuhan Tambahan / Daya Listrik (Watt)',
    tipe: 'Textarea',
    required: false,
    options: null,
  },
];

function getLocalKey(eventId: string, formType: FormType): string {
  return `kobar_form_fields_${eventId}_${formType}`;
}

export const formFieldService = {
  // Fetch fields for an event and formType
  async getFormFields(eventId: string, formType: FormType): Promise<FormField[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('form_fields')
          .select('*')
          .eq('event_id', eventId)
          .eq('form_type', formType)
          .order('urutan', { ascending: true });

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.error('getFormFields supabase error:', err);
      }
    }

    // Local storage fallback
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getLocalKey(eventId, formType));
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore error
        }
      }
    }

    // Clean state: If not found in database or local storage, return empty array
    return [];
  },

  // Save fields atomically: overwriting all fields for this event & formType
  // Skips lines with empty labels
  async saveFormFields(
    eventId: string,
    formType: FormType,
    fields: FormField[]
  ): Promise<{ success: boolean; count: number; error?: string }> {
    // Filter out rows without label
    const validFields = fields
      .filter((f) => f.label && f.label.trim() !== '')
      .map((f, idx) => ({
        ...f,
        event_id: eventId,
        form_type: formType,
        urutan: idx + 1,
        label: f.label.trim(),
      }));

    if (isSupabaseConfigured) {
      try {
        // Try atomic RPC first
        const { data: rpcData, error: rpcErr } = await supabase.rpc('save_form_fields_atomic', {
          p_event_id: eventId,
          p_form_type: formType,
          p_fields: validFields,
        });

        if (!rpcErr) {
          return { success: true, count: validFields.length };
        }

        // Fallback: direct delete + insert
        await supabase
          .from('form_fields')
          .delete()
          .eq('event_id', eventId)
          .eq('form_type', formType);

        if (validFields.length > 0) {
          const insertPayload = validFields.map((f) => ({
            event_id: eventId,
            form_type: formType,
            urutan: f.urutan,
            label: f.label,
            tipe: f.tipe,
            required: f.required,
            options: f.options,
          }));

          const { error: insErr } = await supabase.from('form_fields').insert(insertPayload);
          if (insErr) return { success: false, count: 0, error: insErr.message };
        }

        return { success: true, count: validFields.length };
      } catch (err: any) {
        return { success: false, count: 0, error: err.message };
      }
    }

    // Local Storage mock
    if (typeof window !== 'undefined') {
      localStorage.setItem(getLocalKey(eventId, formType), JSON.stringify(validFields));
    }

    return { success: true, count: validFields.length };
  },

  // Upload image asset for 'Gambar' field type
  async uploadFieldImage(file: File): Promise<{ url?: string; error?: string }> {
    if (file.size > 2 * 1024 * 1024) {
      return { error: 'Ukuran file gambar maksimal 2 MB.' };
    }

    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `builder/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, file, { upsert: true });

        if (uploadError) return { error: uploadError.message };

        const { data } = supabase.storage.from('assets').getPublicUrl(fileName);
        return { url: data.publicUrl };
      } catch (err: any) {
        return { error: err.message };
      }
    }

    // Base64 fallback for preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ url: reader.result as string });
      };
      reader.onerror = () => {
        resolve({ error: 'Gagal memproses file' });
      };
      reader.readAsDataURL(file);
    });
  },
};
