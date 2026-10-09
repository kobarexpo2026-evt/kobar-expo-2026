import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Registration, EventItem } from '../../types/database';
import { formatDateIndo, formatRupiah } from '../utils';
import { sendGmailMessage, getGoogleAccessToken, getCurrentGoogleUser } from '../google/gmailService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Check local storage cache before falling back to defaults
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`kobar_email_templates_${eventId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return STANDARD_EMAIL_TRIGGERS.map((st) => {
              const match = parsed.find((p: any) => p.trigger_key === st.key);
              return {
                id: match?.id,
                event_id: eventId,
                trigger_key: st.key,
                trigger_label: st.label,
                aktif: match ? match.aktif : true,
                subjek: match ? match.subjek : st.defaultSubject,
                isi_html: match ? match.isi_html : st.defaultBody,
                attach_invoice: match ? Boolean(match.attach_invoice) : false,
                include_ticket: match?.include_ticket ?? (st.hasTicket ?? false),
              };
            });
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage load email template warning:', e);
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
    // Always persist to localStorage for resilience
    try {
      if (typeof window !== 'undefined') {
        const key = `kobar_email_templates_${template.event_id}`;
        const stored = localStorage.getItem(key);
        let list: EmailTemplateItem[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex((t) => t.trigger_key === template.trigger_key);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...template };
        } else {
          list.push(template);
        }
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('LocalStorage save email template warning:', e);
    }

    if (isSupabaseConfigured) {
      try {
        // Attempt 1: Direct table upsert
        const { error: upsertErr } = await supabase
          .from('email_templates')
          .upsert({
            event_id: template.event_id,
            trigger_key: template.trigger_key,
            aktif: template.aktif,
            subjek: template.subjek,
            isi_html: template.isi_html,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'event_id, trigger_key' });

        if (!upsertErr) return { success: true };

        // Attempt 2: RPC if upsert fails
        const { error } = await supabase.rpc('save_email_template', {
          p_event_id: template.event_id,
          p_trigger_key: template.trigger_key,
          p_aktif: template.aktif,
          p_subjek: template.subjek,
          p_isi_html: template.isi_html,
        });

        if (error) return { success: true }; // LocalStorage already preserved
        return { success: true };
      } catch (err: any) {
        return { success: true }; // LocalStorage already preserved
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

    // Check localStorage cache
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`kobar_invoice_template_${eventId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.template_html) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage invoice load warning:', e);
    }

    return {
      event_id: eventId,
      nama_template: 'Template Invoice Resmi Kobar Expo',
      template_html: DEFAULT_INVOICE_HTML,
    };
  },

  // Save invoice template
  async saveInvoiceTemplate(template: InvoiceTemplateItem): Promise<{ success: boolean; error?: string }> {
    // Always persist to localStorage
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`kobar_invoice_template_${template.event_id}`, JSON.stringify(template));
      }
    } catch (e) {
      console.warn('LocalStorage save invoice warning:', e);
    }

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

  // Automatically trigger email based on current registration status or custom trigger
  async triggerAutoEmail(registration: Registration, triggerKey?: string): Promise<{ success: boolean; simulated?: boolean; messageId?: string }> {
    try {
      if (!registration.email || !registration.event_id) {
        return { success: false };
      }

      const key = triggerKey || `${registration.status_bayar}|${registration.status_lulus}`;
      const templates = await this.getEmailTemplates(registration.event_id);
      const matchedTemplate = templates.find((t) => t.trigger_key === key && t.aktif);
      
      if (!matchedTemplate) {
        return { success: false };
      }

      const renderedSubject = this.replacePlaceholders(matchedTemplate.subjek, registration);
      let renderedHtml = this.replacePlaceholders(matchedTemplate.isi_html, registration);

      if (matchedTemplate.include_ticket || key === 'PENDAFTARAN_DITERIMA' || key === 'Lunas|Lulus') {
        renderedHtml += this.generateVisualTicketHtml(registration);
      }

      const attachments: { filename: string; content: string }[] = [];

      // Automatically attach PDF invoice if template has attach_invoice enabled
      if (matchedTemplate.attach_invoice) {
        try {
          const pdfBase64 = this.generateInvoicePdfBase64(registration);
          if (pdfBase64) {
            attachments.push({
              filename: `Invoice-KOBAR-EXPO-${registration.reg_id}.pdf`,
              content: pdfBase64,
            });
          }
        } catch (pdfErr) {
          console.warn('Failed to generate PDF attachment:', pdfErr);
        }
      }

      return await this.sendEmail({
        to: registration.email,
        subject: renderedSubject,
        html: renderedHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
    } catch (err) {
      console.error('triggerAutoEmail error:', err);
      return { success: false };
    }
  },

  // Generate PDF Invoice as base64 string using jsPDF & autoTable
  generateInvoicePdfBase64(registration: Registration): string {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const amberColor = [217, 119, 6];
    const darkColor = [28, 25, 23];
    const grayColor = [120, 113, 108];

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(amberColor[0], amberColor[1], amberColor[2]);
    doc.text('KOBAR EXPO 2026', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Pemerintah Kabupaten Kotawaringin Barat', 14, 25);
    doc.text('Tanda Bukti Registrasi & Invoice Resmi', 14, 29);

    // Invoice Box Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`INVOICE: ${registration.reg_id}`, 196, 20, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Tanggal: ${formatDateIndo(registration.created_at || new Date().toISOString())}`, 196, 25, { align: 'right' });
    doc.text(`Status: ${registration.status_bayar}`, 196, 29, { align: 'right' });

    doc.setDrawColor(220, 220, 220);
    doc.line(14, 34, 196, 34);

    // Bill To & Event Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('DITERBITKAN UNTUK:', 14, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Nama: ${registration.nama}`, 14, 48);
    doc.text(`Email: ${registration.email}`, 14, 53);
    doc.text(`WhatsApp: ${registration.wa}`, 14, 58);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('RINCIAN AGENDA:', 110, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Event: ${registration.event_nama || 'KOBAR EXPO 2026'}`, 110, 48);
    doc.text(`Status Kelulusan: ${registration.status_lulus}`, 110, 53);
    doc.text('Lokasi: Pangkalan Bun, Kotawaringin Barat', 110, 58);

    // Table
    autoTable(doc, {
      startY: 65,
      head: [['No', 'Deskripsi Layanan / Kegiatan', 'Status Bayar', 'Total Biaya']],
      body: [
        [
          '1',
          `Biaya Pendaftaran / Partisipasi: ${registration.event_nama || 'KOBAR EXPO 2026'}\nNomor Registrasi: ${registration.reg_id}`,
          registration.status_bayar,
          formatRupiah(registration.event_harga || 0),
        ],
      ],
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 100 },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 95;

    // Total box
    doc.setFillColor(254, 243, 199);
    doc.rect(120, finalY + 6, 76, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9);
    doc.text('TOTAL PEMBAYARAN:', 124, finalY + 13);
    doc.setFontSize(11.5);
    doc.setTextColor(13, 148, 136);
    doc.text(formatRupiah(registration.event_harga || 0), 192, finalY + 19, { align: 'right' });

    // Footer note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Dokumen ini adalah tanda bukti transaksi dan invoice resmi yang diterbitkan secara elektronik oleh Panitia KOBAR EXPO 2026.', 14, finalY + 36);
    doc.text('Harap simpan dokumen ini sebagai bukti sah keikutsertaan Anda.', 14, finalY + 41);

    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1] || '';
  },

  // Send email via Google Workspace Gmail API (if connected) or backend server proxy
  async sendEmail(payload: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: string }[];
  }): Promise<{ success: boolean; simulated?: boolean; messageId?: string; error?: string; via?: 'gmail' | 'server' }> {
    // 1. If Google Workspace / Gmail is authenticated by the user, send directly via official Gmail API
    const googleToken = getGoogleAccessToken();
    const googleUser = getCurrentGoogleUser();

    if (googleToken && googleUser) {
      try {
        const gmailAttachments = payload.attachments?.map((a) => ({
          filename: a.filename,
          mimeType: 'application/pdf',
          base64Content: a.content,
        }));

        const gmailRes = await sendGmailMessage({
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          attachments: gmailAttachments,
        });

        if (gmailRes.success) {
          return {
            success: true,
            messageId: gmailRes.id,
            simulated: false,
            via: 'gmail',
          };
        } else {
          console.warn('Gmail API returned error, falling back to server dispatch:', gmailRes.error);
        }
      } catch (gmailErr: any) {
        console.warn('Gmail API failed, trying server fallback:', gmailErr);
      }
    }

    // 2. Fallback to server route /api/send-email
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return { 
          success: true, 
          simulated: data.simulated, 
          messageId: data.id,
          via: 'server'
        };
      } else {
        return {
          success: false,
          error: data.error || 'Gagal mengirim email.',
        };
      }
    } catch (err: any) {
      console.error('sendEmail network error:', err);
      return {
        success: false,
        error: err.message || 'Gagal menghubungi server.',
      };
    }
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
