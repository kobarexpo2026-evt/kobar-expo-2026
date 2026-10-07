import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Gmail scope for sending emails
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('email');
provider.addScope('profile');

// In-memory token cache (Do NOT store in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GmailAttachment {
  filename: string;
  mimeType?: string;
  base64Content: string;
}

/**
 * Initialize Google Auth state listener.
 */
export const initGoogleAuth = (
  onSuccess?: (user: User, accessToken: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      if (onFailure) onFailure();
    }
  });
};

/**
 * Sign in with Google to grant Gmail sending permission.
 */
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current cached access token.
 */
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Get current Google authenticated user.
 */
export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Sign out from Google.
 */
export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Helper to encode message with optional MIME attachments (RFC 2046) into Base64URL for Gmail API.
 */
function createRawEmail(
  to: string, 
  from: string, 
  subject: string, 
  html: string,
  attachments?: GmailAttachment[]
): string {
  // RFC 2047 MIME encoded subject for UTF-8 support
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  if (!attachments || attachments.length === 0) {
    // Single part HTML message
    const emailLines = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(html))),
    ];

    const raw = emailLines.join('\r\n');
    return btoa(raw)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Multipart Mixed message for attachments (PDF, invoices, etc.)
  const boundary = `kobar_boundary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(html))),
  ];

  for (const att of attachments) {
    const filename = att.filename || 'Lampiran.pdf';
    const mimeType = att.mimeType || 'application/pdf';
    // Strip data URI prefix if provided
    const cleanBase64 = att.base64Content.replace(/^data:[^;]+;base64,/, '');

    lines.push(
      '',
      `--${boundary}`,
      `Content-Type: ${mimeType}; name="${filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${filename}"`,
      '',
      cleanBase64
    );
  }

  lines.push('', `--${boundary}--`);

  const raw = lines.join('\r\n');
  return btoa(raw)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email directly via Google Gmail API (using OAuth access token).
 */
export const sendGmailMessage = async ({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: GmailAttachment[];
}): Promise<{ success: boolean; id?: string; error?: string }> => {
  const token = cachedAccessToken;
  const currentUser = auth.currentUser;

  if (!token || !currentUser) {
    return {
      success: false,
      error: 'Akun Google / Gmail belum terhubung. Silakan klik "Hubungkan Akun Google" terlebih dahulu.',
    };
  }

  const fromEmail = currentUser.email || 'me';
  const rawEmail = createRawEmail(to, `KOBAR EXPO 2026 <${fromEmail}>`, subject, html, attachments);

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: rawEmail,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Gmail API Send Error:', data);
      return {
        success: false,
        error: data.error?.message || 'Gagal mengirim email melalui Gmail API.',
      };
    }

    return {
      success: true,
      id: data.id,
    };
  } catch (err: any) {
    console.error('Gmail API network error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menghubungi server Gmail API.',
    };
  }
};
