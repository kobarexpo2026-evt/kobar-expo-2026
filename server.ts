import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

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

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'KOBAR EXPO 2026 <onboarding@resend.dev>';

    // If Resend API key is present in environment, call the real Resend REST API
    if (apiKey && apiKey.trim() !== '') {
      const response = await fetch('https://api.resend.com/emails', {
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

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Resend API error' });
      }

      return res.json({ success: true, id: data.id, simulated: false });
    }

    // Offline / Demo Simulator Mode (when RESEND_API_KEY is not yet set)
    console.log(`[Resend Email Simulated] To: ${to} | Subject: "${subject}"`);
    return res.json({
      success: true,
      simulated: true,
      id: `sim_${Date.now()}`,
      message: 'Email simulated successfully (add RESEND_API_KEY to send real emails).',
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
