import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// ESM dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// ==============================================================================
// 1. API PROXY ROUTE: RESEND EMAIL SENDER
// ==============================================================================
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text, attachments } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Field to, subject, and html are required.' });
    }

    // Refresh environment from .env.local if present
    if (fs.existsSync('.env.local')) {
      dotenv.config({ path: '.env.local', override: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'KOBAR EXPO 2026 <onboarding@resend.dev>';
    fromEmail = fromEmail.replace(/^["']|["']$/g, '').trim();

    // If Resend API key is present in environment, call the real Resend REST API
    if (apiKey && apiKey.trim() !== '') {
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
            console.log(`[Resend Email Real Sent via Fallback] To: ${to} | ID: ${fallbackData.id}`);
            return res.json({ 
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
        console.error('[Resend API Error]:', data);
        return res.status(400).json({ 
          error: data.message || data.error?.message || 'Gagal mengirim email via Resend API. Pastikan domain terverifikasi di resend.com/domains atau gunakan onboarding@resend.dev.',
          details: data 
        });
      }

      console.log(`[Resend Email Real Sent] To: ${to} | Subject: "${subject}" | ID: ${data.id}`);
      return res.json({ success: true, id: data.id, simulated: false });
    }

    // Offline / Demo Simulator Mode (when RESEND_API_KEY is not yet set)
    console.log(`[Resend Email Simulated] To: ${to} | Subject: "${subject}"`);
    return res.json({
      success: true,
      simulated: true,
      id: `sim_${Date.now()}`,
      message: 'Email disimulasikan (Kunci API Resend belum aktif).',
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ==============================================================================
// 2. VITE MIDDLEWARE / SPA STATIC HANDLER
// ==============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production build
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> KOBAR EXPO 2026 Applet running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
