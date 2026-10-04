import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Registration, EventItem } from '../../types/database';
import { formatDateIndo, formatRupiah } from '../utils';
import jsPDF from 'jspdf';

export interface EmailTemplateItem {
  id?: string;
  event_id: string;
  trigger_key: string;
  trigger_label: string;
  aktif: boolean;
  subjek: string;
  isi_html: string;
  attach_invoice?: boolean;
  include_ticket?: boolean;
}

export interface InvoiceTemplateItem {
  id?: string;
  event_id: string;
  nama_template: string;
  template_html: string;
}

// 7 Standard Triggers for Email
export const STANDARD_EMAIL_TRIGGERS: { key: string; label: string; defaultSubject: string; defaultBody: string; hasTicket?: boolean }[] = [
  {
    key: 'PENDAFTARAN_DITERIMA',
    label: '1. Pendaftaran Berhasil Dikirim',
    defaultSubject: 'Konfirmasi Pendaftaran KOBAR EXPO 2026: {eventNama} ({regId})',
    defaultBody: `<p>Halo <strong>{nama}</strong>,</p>
<p>Terima kasih telah mendaftar pada kegiatan <strong>{eventNama}</strong> dalam rangkaian KOBAR EXPO 2026.</p>
<p>Nomor Registrasi resmi Anda adalah: <strong>{regId}</strong>.</p>
<p>Silakan simpan nomor registrasi ini untuk mengecek status verifikasi berkas dan pembayaran Anda melalui portal resmi kami.</p>
<p>Salam hangat,<br><strong>Panitia KOBAR EXPO 2026</strong></p>`,
    hasTicket: true,
  },
  {
    key: 'Lunas|Lulus',
    label: '2. Pembayaran Lunas & Dinyatakan Lulus',
    defaultSubject: 'Selamat! Pendaftaran {eventNama} Telah LUNAS & LULUS ({regId})',
    defaultBody: `<p>Yth. <strong>{nama}</strong>,</p>
<p>Kabar gembira! Pembayaran Anda sebesar <strong>{totalPembayaran}</strong> telah kami terima (Lunas) dan berkas Anda dinyatakan <strong>LULUS</strong> seleksi pada kegiatan <strong>{eventNama}</strong>.</p>
<p>Invoice resmi dan tanda peserta terlampir pada email ini.</p>
<p>Sampai jumpa di arena KOBAR EXPO 2026!</p>`,
  },
  {
    key: 'Lunas|Belum Lulus',
    label: '3. Pembayaran Lunas (Menunggu Kurasi)',
    defaultSubject: 'Pembayaran Diterima - Berkas Sedang Dikurasi: {eventNama} ({regId})',
    defaultBody: `<p>Halo <strong>{nama}</strong>,</p>
<p>Pembayaran pendaftaran Anda sebesar <strong>{totalPembayaran}</strong> telah berhasil diverifikasi (Lunas). Saat ini tim kurasi sedang meninjau berkas pendaftaran Anda.</p>
<p>Pemberitahuan kelulusan akan kami sampaikan segera.</p>`,
  },
  {
    key: 'Verifikasi Proses|Belum Lulus',
    label: '4. Bukti Pembayaran Sedang Diverifikasi',
    defaultSubject: 'Bukti Pembayaran Diterima dalam Antrean Verifikasi ({regId})',
    defaultBody: `<p>Halo <strong>{nama}</strong>,</p>
<p>Bukti pembayaran Anda untuk <strong>{eventNama}</strong> telah kami terima dan saat ini sedang dalam proses verifikasi oleh tim bendahara panitia.</p>
<p>Mohon menunggu konfirmasi selanjutnya dalam waktu 1x24 jam kerja.</p>`,
  },
  {
    key: 'Ditolak|Belum Lulus',
    label: '5. Bukti Pembayaran Ditolak',
    defaultSubject: 'Pemberitahuan: Bukti Pembayaran Perlu Diperbaiki ({regId})',
    defaultBody: `<p>Halo <strong>{nama}</strong>,</p>
<p>Mohon maaf, bukti pembayaran yang Anda unggah untuk kegiatan <strong>{eventNama}</strong> belum dapat kami verifikasi (nominal tidak sesuai / bukti buram).</p>
<p>Silakan akses menu <strong>Cek Status</strong> pada portal resmi kami untuk mengunggah ulang bukti pembayaran yang valid.</p>`,
  },
  {
    key: 'Belum Bayar|Lulus',
    label: '6. Dinyatakan Lulus (Instruksi Pembayaran Lanjutan)',
    defaultSubject: 'Selamat! Anda Dinyatakan LULUS - Silakan Selesaikan Pembayaran ({regId})',
    defaultBody: `<p>Yth. <strong>{nama}</strong>,</p>
<p>Selamat! Pengajuan Anda untuk <strong>{eventNama}</strong> telah dinyatakan <strong>LULUS KURASI</strong>.</p>
<p>Silakan lanjutkan pelunasan biaya keikutsertaan sebesar <strong>{totalPembayaran}</strong> melalui form Pembayaran Lanjutan di portal kami.</p>`,
  },
  {
    key: 'Belum Bayar|Ditolak',
    label: '7. Berkas Belum Lolos Seleksi',
    defaultSubject: 'Hasil Seleksi Pendaftaran KOBAR EXPO 2026 ({regId})',
    defaultBody: `<p>Yth. <strong>{nama}</strong>,</p>
<p>Terima kasih atas partisipasi Anda pada kegiatan <strong>{eventNama}</strong>. Berdasarkan hasil kurasi dewan juri/panitia, mohon maaf pendaftaran Anda belum dapat diakomodasi pada expo kali ini karena keterbatasan kuota.</p>
<p>Kami sangat mengapresiasi karya dan partisipasi Anda.</p>`,
  },
];

// Default HTML Invoice Template
export const DEFAULT_INVOICE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; padding: 24px; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #d97706; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 20px; font-weight: bold; color: #d97706; margin: 0; }
    .subtitle { font-size: 11px; color: #78716c; margin: 2px 0 0 0; }
    .invoice-id { text-align: right; font-family: monospace; font-size: 15px; font-weight: bold; color: #b45309; }
    .grid { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .col { width: 48%; }
    .col-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #a8a29e; margin-bottom: 6px; }
    .info-line { margin-bottom: 4px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table th { background: #fef3c7; color: #92400e; text-align: left; padding: 10px; font-size: 11px; border-bottom: 1px solid #fde68a; }
    .table td { padding: 10px; border-bottom: 1px solid #f5f5f4; }
    .total-box { background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 8px; text-align: right; margin-bottom: 24px; }
    .total-label { font-size: 12px; color: #78716c; }
    .total-amount { font-size: 18px; font-weight: bold; color: #0d9488; }
    .footer { font-size: 10px; color: #a8a29e; text-align: center; border-top: 1px solid #e7e5e4; padding-top: 12px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
    .badge-lunas { background: #dcfce7; color: #15803d; }
    .badge-proses { background: #fef9c3; color: #a16207; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">KOBAR EXPO 2026</h1>
      <p class="subtitle">Pemerintah Kabupaten Kotawaringin Barat &bull; Tanda Bukti Transaksi Resmi</p>
    </div>
    <div class="invoice-id">
      INVOICE: {regId}
      <div style="font-size: 10px; color: #78716c; font-weight: normal;">Cetak: {tanggalCetak}</div>
    </div>
  </div>

  <div class="grid">
    <div class="col">
      <div class="col-title">Diterbitkan Untuk:</div>
      <div class="info-line"><strong>{nama}</strong></div>
      <div class="info-line">Email: {email}</div>
      <div class="info-line">WhatsApp: {wa}</div>
    </div>
    <div class="col" style="text-align: right;">
      <div class="col-title">Rincian Agenda:</div>
      <div class="info-line"><strong>{eventNama}</strong></div>
      <div class="info-line">{eventTanggal}</div>
      <div class="info-line">{eventLokasi}</div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Deskripsi Layanan / Kegiatan</th>
        <th style="text-align: center;">Status Bayar</th>
        <th style="text-align: right;">Biaya Terdaftar</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Biaya Pendaftaran / Partisipasi {eventNama}</strong>
          <div style="font-size: 11px; color: #78716c;">Nomor Registrasi: {regId}</div>
        </td>
        <td style="text-align: center;">
          <span class="badge badge-lunas">{statusBayar}</span>
        </td>
        <td style="text-align: right; font-weight: bold;">
          {totalPembayaran}
        </td>
      </tr>
    </tbody>
  </table>

  <div class="total-box">
    <span class="total-label">Total Pembayaran: </span>
    <span class="total-amount">{totalPembayaran}</span>
  </div>

  <div class="footer">
    Dokumen ini dicetak secara otomatis melalui Sistem Manajemen Event KOBAR EXPO 2026.<br>
    Sah sebagai tanda terima tanpa tanda tangan basah.
  </div>
</body>
</html>`;

export const emailInvoiceService = {
  // Load email templates for an event
  async getEmailTemplates(eventId: string): Promise<EmailTemplateItem[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('event_id', eventId);

        if (!error && data && data.length > 0) {
          // Merge with standard triggers
          return STANDARD_EMAIL_TRIGGERS.map((st) => {
            const match = data.find((d) => d.trigger_key === st.key);
            return {
              id: match?.id,
              event_id: eventId,
              trigger_key: st.key,
              trigger_label: st.label,
              aktif: match ? match.aktif : true,
              subjek: match ? match.subjek : st.defaultSubject,
              isi_html: match ? match.isi_html : st.defaultBody,
              attach_invoice: match ? Boolean(match.invoice_template_id) : false,
              include_ticket: st.hasTicket ?? false,
            };
          });
        }
      } catch (err) {
        console.error('getEmailTemplates error:', err);
      }
    }

    // Local / fallback template list
    return STANDARD_EMAIL_TRIGGERS.map((st) => ({
      event_id: eventId,
      trigger_key: st.key,
      trigger_label: st.label,
      aktif: true,
      subjek: st.defaultSubject,
      isi_html: st.defaultBody,
      attach_invoice: false,
      include_ticket: st.hasTicket ?? false,
    }));
  },

  // Save email template
  async saveEmailTemplate(template: EmailTemplateItem): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('save_email_template', {
          p_event_id: template.event_id,
          p_trigger_key: template.trigger_key,
          p_aktif: template.aktif,
          p_subjek: template.subjek,
          p_isi_html: template.isi_html,
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  },

  // Load invoice template for an event
  async getInvoiceTemplate(eventId: string): Promise<InvoiceTemplateItem> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('invoice_templates')
          .select('*')
          .eq('event_id', eventId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            event_id: eventId,
            nama_template: data.nama_template || 'Template Invoice Resmi',
            template_html: data.template_html || DEFAULT_INVOICE_HTML,
          };
        }
      } catch (err) {
        // fallback
      }
    }

    return {
      event_id: eventId,
      nama_template: 'Template Invoice Resmi Kobar Expo',
      template_html: DEFAULT_INVOICE_HTML,
    };
  },

  // Save invoice template
  async saveInvoiceTemplate(template: InvoiceTemplateItem): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('invoice_templates')
          .upsert({
            event_id: template.event_id,
            trigger_key: 'Lunas|Lulus',
            nama_template: template.nama_template,
            template_html: template.template_html,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'event_id, trigger_key' });

        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  },

  // Replace placeholders in string/html with registration data
  replacePlaceholders(templateStr: string, registration: Registration): string {
    let result = templateStr;

    // Standard Replacements
    result = result.replace(/{regId}/g, registration.reg_id);
    result = result.replace(/{nama}/g, registration.nama);
    result = result.replace(/{email}/g, registration.email);
    result = result.replace(/{wa}/g, registration.wa);
    result = result.replace(/{eventNama}/g, registration.event_nama || 'KOBAR EXPO 2026');
    result = result.replace(/{eventTanggal}/g, '15 - 20 Mei 2026');
    result = result.replace(/{eventLokasi}/g, 'Lapangan Sampuraga, Pangkalan Bun');
    result = result.replace(/{eventHarga}/g, formatRupiah(registration.event_harga || 0));
    result = result.replace(/{totalPembayaran}/g, formatRupiah(registration.event_harga || 0));
    result = result.replace(/{statusBayar}/g, registration.status_bayar);
    result = result.replace(/{statusLulus}/g, registration.status_lulus);
    result = result.replace(/{tanggalCetak}/g, formatDateIndo(new Date().toISOString()));
    result = result.replace(/{petugas}/g, 'Administrator Sistem Kobar Expo');

    // Dynamic Form Fields Replacements
    const answers = registration.answers || {};
    Object.keys(answers).forEach((label) => {
      const regex = new RegExp(`{${label}}`, 'g');
      result = result.replace(regex, String(answers[label] || '-'));
    });

    return result;
  },

  // Generate visual HTML ticket card for emails
  generateVisualTicketHtml(registration: Registration): string {
    return `
<div style="margin: 24px 0; max-width: 480px; background-color: #FFFDF7; border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px; font-family: 'Helvetica Neue', Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
  <div style="border-bottom: 2px solid #fde68a; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
    <div>
      <span style="background-color: #f59e0b; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">Tiket Resmi</span>
      <h3 style="margin: 4px 0 0 0; font-size: 16px; color: #1c1917; font-weight: bold;">KOBAR EXPO 2026</h3>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 9px; color: #78716c;">Nomor Registrasi:</span>
      <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: #d97706;">${registration.reg_id}</div>
    </div>
  </div>
  
  <div style="font-size: 12px; line-height: 1.6; color: #44403c;">
    <div><strong>Nama Peserta:</strong> ${registration.nama}</div>
    <div><strong>Kegiatan:</strong> ${registration.event_nama || 'Event Kobar Expo'}</div>
    <div><strong>WhatsApp:</strong> ${registration.wa}</div>
    <div><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${registration.status_bayar}</span> &bull; <span>${registration.status_lulus}</span></div>
  </div>

  <div style="margin-top: 16px; border-top: 1px dashed #d6d3d1; padding-top: 10px; font-size: 10px; color: #a8a29e; text-align: center;">
    Tunjukkan tiket digital ini kepada petugas registrasi di lokasi expo.
  </div>
</div>`;
  },

  // Send email via backend proxy route (/api/send-email) with Resend
  async sendEmail(payload: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: string }[];
  }): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, simulated: data.simulated, messageId: data.id };
      }
    } catch {
      // ignore network errors and fallback to simulator
    }

    // Graceful offline simulator fallback
    console.log('[Resend Email Simulator] Sending to:', payload.to, 'Subject:', payload.subject);
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  },

  // Download printable PDF invoice for a registration
  downloadInvoicePdf(registration: Registration, invoiceHtmlTemplate?: string) {
    const template = invoiceHtmlTemplate || DEFAULT_INVOICE_HTML;
    const finalHtml = this.replacePlaceholders(template, registration);

    // Create an iframe to render the HTML and print/save to PDF cleanly
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(finalHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  },

  // Download merged mass invoices
  downloadMassInvoices(registrations: Registration[], invoiceHtmlTemplate?: string) {
    const template = invoiceHtmlTemplate || DEFAULT_INVOICE_HTML;
    const combinedHtml = registrations
      .map((r) => `<div style="page-break-after: always;">${this.replacePlaceholders(template, r)}</div>`)
      .join('\n');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(combinedHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  },
};
