/**
 * KOBAR EXPO 2026 - Database Type Definitions
 */

export type UserRole = 'super_admin' | 'admin';
export type EventStatus = 'Buka' | 'Tutup' | 'Draft';
export type AccessMode = 'Publik' | 'Undangan';
export type FormType = 'Pendaftaran' | 'Pembayaran';
export type FieldType = 
  | 'Text' 
  | 'Textarea' 
  | 'Number' 
  | 'Email' 
  | 'Date' 
  | 'Dropdown' 
  | 'Checkbox' 
  | 'Radio' 
  | 'File' 
  | 'File Multiple' 
  | 'Signature' 
  | 'Judul' 
  | 'Link' 
  | 'Gambar';

export type PaymentStatus = 'Belum Bayar' | 'Verifikasi Proses' | 'Lunas' | 'Ditolak';
export type GraduationStatus = 'Belum Lulus' | 'Lulus' | 'Ditolak';
export type StatusBayar = PaymentStatus;
export type StatusLulus = GraduationStatus;
export type FileKind = 'pendaftaran' | 'pembayaran' | 'ttd';

export interface Profile {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface AdminEventAccess {
  id: string;
  admin_id: string;
  event_id: string;
  created_at: string;
}

export interface EventItem {
  id: string;
  kode: string;
  nama: string;
  tanggal: string;
  lokasi: string;
  status: EventStatus;
  kuota: number | null;
  banner_url: string | null;
  qris_url: string | null;
  harga: number;
  bayar_lanjut: boolean;
  mode_akses: AccessMode;
  urutan: number;
  created_at: string;
  updated_at?: string;
  // Computed / aggregated attributes
  total_pendaftar?: number;
  total_lunas?: number;
}

export interface FormField {
  id: string;
  event_id: string;
  form_type: FormType;
  urutan: number;
  label: string;
  tipe: FieldType;
  required: boolean;
  options: string | null;
  created_at?: string;
}

export interface Registration {
  id: string;
  reg_id: string;
  event_id: string;
  nama: string;
  email: string;
  wa: string;
  status_bayar: PaymentStatus;
  status_lulus: GraduationStatus;
  answers: Record<string, any>;
  created_at: string;
  updated_at?: string;
  // Join attributes
  event_nama?: string;
  event_harga?: number;
  event_bayar_lanjut?: boolean;
}

export interface RegistrationFile {
  id: string;
  registration_id: string;
  field_label: string;
  storage_path: string;
  kind: FileKind;
  created_at: string;
  signed_url?: string;
}

export interface PaymentSubmission {
  id: string;
  registration_id: string;
  answers: Record<string, any>;
  created_at: string;
}

export interface InvitationCode {
  id: string;
  event_id: string;
  kode: string;
  batas_pemakaian: number;
  jumlah_terpakai: number;
  created_at: string;
}

export interface InvoiceTemplate {
  id: string;
  event_id: string;
  trigger_key: string;
  nama_template: string;
  template_html: string;
  placeholders: Array<{
    placeholder: string;
    source: 'regId' | 'tanggal' | 'nama' | 'email' | 'wa' | 'statusBayar' | 'statusLulus' | 'totalPembayaran' | 'formLabel';
    keyword?: string;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface EmailTemplate {
  id: string;
  event_id: string;
  trigger_key: string;
  aktif: boolean;
  subjek: string;
  isi_html: string;
  invoice_template_id: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AdminColumnPreference {
  id: string;
  admin_id: string;
  event_key: string;
  columns: string[];
  created_at?: string;
  updated_at?: string;
}
