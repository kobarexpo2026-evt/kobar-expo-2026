import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Registration, StatusBayar, StatusLulus } from '../../types/database';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIndo, formatRupiah } from '../utils';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  isDynamic?: boolean;
}

export interface RegistrationFileItem {
  id: string;
  field_label: string;
  storage_path: string;
  kind: 'pendaftaran' | 'pembayaran' | 'ttd';
  signed_url?: string;
  is_image?: boolean;
}

const LOCAL_STORAGE_REG_KEY = 'kobar_registrations_data';

// No sample registrations - purely database-driven
const SAMPLE_REGISTRATIONS: Registration[] = [];

function getStoredLocalRegistrations(): Registration[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(LOCAL_STORAGE_REG_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    // If it contains old sample data, purge it
    if (Array.isArray(parsed) && parsed.some((r: any) => r.id?.startsWith('reg-00'))) {
      localStorage.removeItem(LOCAL_STORAGE_REG_KEY);
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export const registrationService = {
  // Fetch all registrations with filtering
  async getRegistrations(filter?: {
    eventId?: string;
    search?: string;
    statusBayar?: string;
    statusLulus?: string;
  }): Promise<Registration[]> {
    let list: Registration[] = [];

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('registrations')
          .select('*, events(nama, harga, bayar_lanjut, tanggal, lokasi)')
          .order('created_at', { ascending: false });

        if (filter?.eventId && filter.eventId !== 'ALL') {
          query = query.eq('event_id', filter.eventId);
        }

        if (filter?.statusBayar && filter.statusBayar !== 'ALL') {
          query = query.eq('status_bayar', filter.statusBayar);
        }

        if (filter?.statusLulus && filter.statusLulus !== 'ALL') {
          query = query.eq('status_lulus', filter.statusLulus);
        }

        const { data, error } = await query;
        if (!error && data) {
          list = data.map((d: any) => ({
            ...d,
            event_nama: d.events?.nama,
            event_harga: d.events?.harga,
            event_bayar_lanjut: d.events?.bayar_lanjut,
          }));
        }
      } catch (err) {
        console.error('getRegistrations error:', err);
      }
    }

    if (list.length === 0) {
      list = getStoredLocalRegistrations();
      if (filter?.eventId && filter.eventId !== 'ALL') {
        list = list.filter((r) => r.event_id === filter.eventId);
      }
      if (filter?.statusBayar && filter.statusBayar !== 'ALL') {
        list = list.filter((r) => r.status_bayar === filter.statusBayar);
      }
      if (filter?.statusLulus && filter.statusLulus !== 'ALL') {
        list = list.filter((r) => r.status_lulus === filter.statusLulus);
      }
    }

    // Client-side text search (matches reg_id, nama, email, wa, answers values)
    if (filter?.search && filter.search.trim() !== '') {
      const q = filter.search.toLowerCase().trim();
      list = list.filter((r) => {
        const inRegId = r.reg_id.toLowerCase().includes(q);
        const inNama = r.nama.toLowerCase().includes(q);
        const inEmail = r.email.toLowerCase().includes(q);
        const inWa = r.wa.toLowerCase().includes(q);
        const inAnswers = Object.values(r.answers || {}).some((v) =>
          String(v).toLowerCase().includes(q)
        );
        return inRegId || inNama || inEmail || inWa || inAnswers;
      });
    }

    return list;
  },

  // Update single registration status
  async updateStatus(
    id: string,
    statusBayar: StatusBayar,
    statusLulus: StatusLulus
  ): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('registrations')
          .update({
            status_bayar: statusBayar,
            status_lulus: statusLulus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // Local Storage update
    const current = getStoredLocalRegistrations();
    const updated = current.map((r) =>
      r.id === id ? { ...r, status_bayar: statusBayar, status_lulus: statusLulus } : r
    );
    localStorage.setItem(LOCAL_STORAGE_REG_KEY, JSON.stringify(updated));
    return { success: true };
  },

  // Bulk update status
  async bulkUpdateStatus(
    ids: string[],
    statusBayar?: StatusBayar | null,
    statusLulus?: StatusLulus | null
  ): Promise<{ success: boolean; count: number; error?: string }> {
    if (ids.length === 0) return { success: true, count: 0 };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('bulk_update_registrations_status', {
          p_ids: ids,
          p_status_bayar: statusBayar || null,
          p_status_lulus: statusLulus || null,
        });

        if (error) return { success: false, count: 0, error: error.message };
        return { success: true, count: data?.count || ids.length };
      } catch (err: any) {
        return { success: false, count: 0, error: err.message };
      }
    }

    // Local Storage update
    const current = getStoredLocalRegistrations();
    const updated = current.map((r) => {
      if (ids.includes(r.id)) {
        return {
          ...r,
          status_bayar: statusBayar || r.status_bayar,
          status_lulus: statusLulus || r.status_lulus,
        };
      }
      return r;
    });
    localStorage.setItem(LOCAL_STORAGE_REG_KEY, JSON.stringify(updated));
    return { success: true, count: ids.length };
  },

  // Delete registration
  async deleteRegistration(id: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('registrations').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    const current = getStoredLocalRegistrations();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_REG_KEY, JSON.stringify(updated));
    return { success: true };
  },

  // Bulk delete registrations
  async bulkDelete(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (ids.length === 0) return { success: true, count: 0 };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('bulk_delete_registrations', {
          p_ids: ids,
        });
        if (error) return { success: false, count: 0, error: error.message };
        return { success: true, count: data?.count || ids.length };
      } catch (err: any) {
        return { success: false, count: 0, error: err.message };
      }
    }

    const current = getStoredLocalRegistrations();
    const updated = current.filter((r) => !ids.includes(r.id));
    localStorage.setItem(LOCAL_STORAGE_REG_KEY, JSON.stringify(updated));
    return { success: true, count: ids.length };
  },

  // Fetch attachments & signatures with Signed URLs from Supabase storage (private 'registrations' bucket)
  async getRegistrationFiles(registration: Registration): Promise<RegistrationFileItem[]> {
    const items: RegistrationFileItem[] = [];

    // Helper to process individual value
    const processVal = async (key: string, val: any, indexSuffix = '') => {
      if (!val) return;
      const strVal = String(val).trim();
      if (!strVal) return;

      const isSignature = key.toLowerCase().includes('pernyataan') || key.toLowerCase().includes('signature') || key.toLowerCase().includes('ttd') || strVal.includes('Tanda Tangan') || strVal.startsWith('data:image/');
      const hasImageExt = /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(strVal);
      const isPdf = /\.pdf$/i.test(strVal);
      const isFile = isPdf || hasImageExt || isSignature || strVal.startsWith('data:') || strVal.startsWith('http');

      if (isFile) {
        let signedUrl: string | undefined = undefined;

        if (strVal.startsWith('http') || strVal.startsWith('data:')) {
          signedUrl = strVal;
        } else if (isSupabaseConfigured) {
          try {
            // Generate temporary 1-hour signed URL from private bucket 'registrations'
            const path = `uploads/${registration.id}/${strVal}`;
            const { data } = await supabase.storage
              .from('registrations')
              .createSignedUrl(path, 3600);
            if (data?.signedUrl) {
              signedUrl = data.signedUrl;
            }
          } catch {
            // fallback
          }
        }

        // Demo sample image fallback if URL could not be resolved
        if (!signedUrl) {
          if (isPdf) {
            signedUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
          } else {
            signedUrl = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';
          }
        }

        const isImage = !isPdf && (hasImageExt || isSignature || strVal.startsWith('data:image/') || (!isPdf && signedUrl.includes('unsplash')));

        items.push({
          id: `file-${key}${indexSuffix}`,
          field_label: key,
          storage_path: strVal.length > 50 ? strVal.substring(0, 47) + '...' : strVal,
          kind: key.toLowerCase().includes('bukti') || key.toLowerCase().includes('bayar') 
            ? 'pembayaran' 
            : isSignature 
            ? 'ttd' 
            : 'pendaftaran',
          signed_url: signedUrl,
          is_image: isImage,
        });
      }
    };

    // Parse answers for uploaded filenames or signatures
    const answers = registration.answers || {};
    for (const [key, val] of Object.entries(answers)) {
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          await processVal(key, val[i], `-${i}`);
        }
      } else {
        await processVal(key, val);
      }
    }

    return items;
  },

  // Export registrations to Excel (.xlsx)
  exportToExcel(registrations: Registration[], visibleColumns: ColumnConfig[], filename: string) {
    const activeCols = visibleColumns.filter((c) => c.visible);

    const rows = registrations.map((r, idx) => {
      const rowData: Record<string, any> = {};

      activeCols.forEach((col) => {
        if (col.key === 'no') {
          rowData[col.label] = idx + 1;
        } else if (col.key === 'reg_id') {
          rowData[col.label] = r.reg_id;
        } else if (col.key === 'created_at') {
          rowData[col.label] = formatDateIndo(r.created_at);
        } else if (col.key === 'nama') {
          rowData[col.label] = r.nama;
        } else if (col.key === 'email') {
          rowData[col.label] = r.email;
        } else if (col.key === 'wa') {
          rowData[col.label] = r.wa;
        } else if (col.key === 'event_nama') {
          rowData[col.label] = r.event_nama || '-';
        } else if (col.key === 'status_bayar') {
          rowData[col.label] = r.status_bayar;
        } else if (col.key === 'status_lulus') {
          rowData[col.label] = r.status_lulus;
        } else if (col.isDynamic) {
          rowData[col.label] = r.answers?.[col.label] || '-';
        }
      });

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pendaftar');

    // Auto-fit column widths
    const max_width = rows.reduce((w: number[], r) => {
      Object.keys(r).forEach((k, i) => {
        const valLen = String(r[k] || '').length;
        w[i] = Math.max(w[i] || 12, valLen + 2);
      });
      return w;
    }, [] as number[]);
    worksheet['!cols'] = max_width.map((width: number) => ({ wch: Math.min(width, 40) }));

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  },

  // Export registrations to PDF report
  exportToPdf(registrations: Registration[], visibleColumns: ColumnConfig[], eventTitle: string) {
    const doc = new jsPDF('landscape');

    // Header Title
    doc.setFontSize(16);
    doc.text('PEMERINTAH KABUPATEN KOTAWARINGIN BARAT', 14, 15);
    doc.setFontSize(12);
    doc.text('PANITIA KOBAR EXPO 2026 – REKAPITULASI PENDAFTARAN PESERTA', 14, 22);
    doc.setFontSize(10);
    doc.text(`Event: ${eventTitle} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
    doc.line(14, 31, 280, 31);

    const activeCols = visibleColumns.filter((c) => c.visible && c.key !== 'no').slice(0, 7); // Pick first 7 for fit
    const tableHeaders = ['No', ...activeCols.map((c) => c.label)];

    const tableData = registrations.map((r, idx) => {
      const row: string[] = [String(idx + 1)];
      activeCols.forEach((col) => {
        if (col.key === 'reg_id') row.push(r.reg_id);
        else if (col.key === 'nama') row.push(r.nama);
        else if (col.key === 'email') row.push(r.email);
        else if (col.key === 'wa') row.push(r.wa);
        else if (col.key === 'status_bayar') row.push(r.status_bayar);
        else if (col.key === 'status_lulus') row.push(r.status_lulus);
        else if (col.key === 'created_at') row.push(formatDateIndo(r.created_at).split(',')[0]);
        else if (col.isDynamic) row.push(String(r.answers?.[col.label] || '-'));
        else row.push('-');
      });
      return row;
    });

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [217, 119, 6] }, // Amber 600
    });

    doc.save(`Laporan-Pendaftar-KobarExpo-${Date.now()}.pdf`);
  },

  // Generate vCard (VCF 3.0) format
  generateVcf(registrations: Registration[]): string {
    return registrations
      .map((r) => {
        // Format WhatsApp to international format (+62...)
        let phone = r.wa.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = `62${phone.substring(1)}`;
        }
        if (!phone.startsWith('+')) {
          phone = `+${phone}`;
        }

        const note = `Kobar Expo 2026 | No. Reg: ${r.reg_id} | Event: ${r.event_nama || '-'} | Status: ${r.status_bayar} - ${r.status_lulus}`;

        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${r.nama}`,
          `N:${r.nama};;;;`,
          `TEL;TYPE=CELL,VOICE:${phone}`,
          `EMAIL;TYPE=INTERNET:${r.email}`,
          `NOTE:${note}`,
          'END:VCARD',
        ].join('\r\n');
      })
      .join('\r\n\r\n');
  },

  // Download VCF file
  downloadVcf(registrations: Registration[], filename: string) {
    const vcfContent = this.generateVcf(registrations);
    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
