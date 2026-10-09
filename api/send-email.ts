import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, subject, html, text, attachments } = req.body || {};

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Field to, subject, and html are required.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'KOBAR EXPO 2026 <onboarding@resend.dev>';
    fromEmail = fromEmail.replace(/^["']|["']$/g, '').trim();

    const isDummyKey = !apiKey || apiKey.trim() === '' || apiKey.startsWith('re_1234') || apiKey.includes('placeholder') || apiKey === 're_xxxxxxxx';

    // If Resend API key is present in Vercel environment variables and not a dummy placeholder, call Resend REST API
    if (apiKey && apiKey.trim() !== '' && !isDummyKey) {
      let response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || undefined,
          attachments: attachments || undefined,
        }),
      });

      let data = await response.json();

      // If API key is rejected as invalid, fallback to simulation mode so registrations/invoices are not blocked
      if (!response.ok && (response.status === 401 || data.message === 'API key is invalid')) {
        return res.status(200).json({
          success: true,
          simulated: true,
          id: `sim_${Date.now()}`,
          message: 'Email disimulasikan (Kunci API Resend tidak valid / demo).',
        });
      }

      // If custom domain is not yet verified on Resend, automatically fallback to onboarding@resend.dev
      if (!response.ok && !fromEmail.includes('onboarding@resend.dev')) {
        console.warn(`[Resend Custom Domain Notice]: Domain pada "${fromEmail}" belum terverifikasi (${data.message || 'validation_error'}). Mencoba fallback via onboarding@resend.dev...`);
        
        try {
          const fallbackResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({
              from: 'KOBAR EXPO 2026 <onboarding@resend.dev>',
              to: Array.isArray(to) ? to : [to],
              subject,
              html,
              text: text || undefined,
              attachments: attachments || undefined,
            }),
          });

          const fallbackData = await fallbackResponse.json();
          if (fallbackResponse.ok) {
            return res.status(200).json({ 
              success: true, 
              id: fallbackData.id, 
              simulated: false,
              warning: `Domain "${fromEmail}" belum diverifikasi di Resend. Email berhasil dikirim via onboarding@resend.dev.`
            });
          }
        } catch (fallbackErr) {
          console.error('[Resend Fallback Error]:', fallbackErr);
        }
      }

      if (!response.ok) {
        return res.status(400).json({ 
          error: data.message || data.error?.message || 'Gagal mengirim email via Resend API.',
          details: data 
        });
      }

      return res.status(200).json({ success: true, id: data.id, simulated: false });
    }

    // Offline / Demo Simulator Mode (when RESEND_API_KEY is not yet configured on Vercel)
    return res.status(200).json({
      success: true,
      simulated: true,
      id: `sim_${Date.now()}`,
      message: 'Email disimulasikan (Kunci API Resend belum aktif di environment).',
    });
  } catch (error: any) {
    console.error('Error sending email on Vercel:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
