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

export interface GoogleAuthUser {
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

export interface GoogleAuthError extends Error {
  code?: string;
  isUnauthorizedDomain?: boolean;
  domain?: string;
  projectId?: string;
  consoleSettingsUrl?: string;
}

let activeGoogleUser: GoogleAuthUser | null = null;

export interface GmailAttachment {
  filename: string;
  mimeType?: string;
  base64Content: string;
}

/**
 * Helper to ensure Google Identity Services script is available
 */
export const loadGisScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).google?.accounts?.oauth2) return resolve();
    const existing = document.getElementById('gsi-client-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
};

/**
 * Initialize Google Auth state listener.
 */
export const initGoogleAuth = (
  onSuccess?: (user: GoogleAuthUser, accessToken: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      const gUser: GoogleAuthUser = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      activeGoogleUser = gUser;
      if (onSuccess) onSuccess(gUser, cachedAccessToken);
    } else if (activeGoogleUser && cachedAccessToken) {
      if (onSuccess) onSuccess(activeGoogleUser, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      activeGoogleUser = null;
      if (onFailure) onFailure();
    }
  });
};

/**
 * Sign in with Google to grant Gmail sending permission.
 * Attempts GIS Token Client first, then falls back to Firebase popup.
 */
export const signInWithGoogle = async (): Promise<{ user: GoogleAuthUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // Attempt 1: Google Identity Services (GIS) Token Client
    // This connects directly to Google OAuth without triggering Firebase Auth domain blocking
    if (firebaseConfig.oAuthClientId && typeof window !== 'undefined') {
      try {
        await loadGisScript();
        const google = (window as any).google;
        if (google?.accounts?.oauth2) {
          const gisResult = await new Promise<{ user: GoogleAuthUser; accessToken: string }>((resolve, reject) => {
            try {
              const client = google.accounts.oauth2.initTokenClient({
                client_id: firebaseConfig.oAuthClientId,
                scope: 'https://www.googleapis.com/auth/gmail.send email profile openid',
                callback: async (resp: any) => {
                  if (resp.error) {
                    reject(new Error(resp.error_description || resp.error));
                    return;
                  }
                  if (!resp.access_token) {
                    reject(new Error('Token akses tidak diterima dari Google.'));
                    return;
                  }
                  cachedAccessToken = resp.access_token;
                  try {
                    const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                      headers: { Authorization: `Bearer ${resp.access_token}` },
                    });
                    const uData = await uRes.json();
                    const u: GoogleAuthUser = {
                      displayName: uData.name || uData.email,
                      email: uData.email,
                      photoURL: uData.picture,
                    };
                    activeGoogleUser = u;
                    resolve({ user: u, accessToken: resp.access_token });
                  } catch {
                    const fallbackUser: GoogleAuthUser = {
                      displayName: 'Akun Google',
                      email: null,
                    };
                    activeGoogleUser = fallbackUser;
                    resolve({ user: fallbackUser, accessToken: resp.access_token });
                  }
                },
              });
              client.requestAccessToken({ prompt: 'consent' });
            } catch (initErr) {
              reject(initErr);
            }
          });

          return gisResult;
        }
      } catch (gisErr) {
        console.warn('Metode GIS tidak berhasil, beralih ke Firebase Auth popup:', gisErr);
      }
    }

    // Attempt 2: Firebase Auth signInWithPopup
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }

    cachedAccessToken = credential.accessToken;
    const gUser: GoogleAuthUser = {
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
    };
    activeGoogleUser = gUser;
    return { user: gUser, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);

    // Identify Firebase unauthorized domain error
    const isUnauthorized = 
      error.code === 'auth/unauthorized-domain' || 
      (typeof error.message === 'string' && error.message.includes('auth/unauthorized-domain'));

    if (isUnauthorized) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain';
      const customErr = new Error(
        `Domain "${currentHost}" belum diizinkan di Firebase Authentication.`
      ) as GoogleAuthError;
      customErr.code = 'auth/unauthorized-domain';
      customErr.isUnauthorizedDomain = true;
      customErr.domain = currentHost;
      customErr.projectId = firebaseConfig.projectId;
      customErr.consoleSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
      throw customErr;
    }

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
export const getCurrentGoogleUser = (): GoogleAuthUser | null => {
  if (activeGoogleUser) return activeGoogleUser;
  if (auth.currentUser) {
    return {
      displayName: auth.currentUser.displayName,
      email: auth.currentUser.email,
      photoURL: auth.currentUser.photoURL,
    };
  }
  return null;
};

/**
 * Sign out from Google.
 */
export const signOutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
  cachedAccessToken = null;
  activeGoogleUser = null;
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
  const currentUser = getCurrentGoogleUser();

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
