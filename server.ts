import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const STUDIO_INBOX_EMAIL = 'gokasrujanreddy@gmail.com';

// Simple per-IP sliding-window rate limiter for contact inquiries
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(ipKey: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(ipKey) ?? []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ipKey, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitStore.set(ipKey, timestamps);

  if (rateLimitStore.size > 500) {
    for (const [key, list] of rateLimitStore.entries()) {
      const fresh = list.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (fresh.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, fresh);
      }
    }
  }
  return false;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+\-\s().]{7,30}$/;
const REFERENCE_ID_PATTERN = /^CTY-[A-Z0-9]{6}$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

interface ContactPayload {
  referenceId?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  reason: string;
  details: string;
}

function validateContactPayload(body: unknown):
  | { valid: true; data: ContactPayload }
  | { valid: false; errors: Record<string, string> } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      valid: false,
      errors: { form: 'Invalid request payload.' },
    };
  }

  const raw = body as Record<string, unknown>;
  const referenceIdRaw = typeof raw.referenceId === 'string' ? raw.referenceId.trim() : '';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const company = typeof raw.company === 'string' ? raw.company.trim() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim() : '';
  const phone = typeof raw.phone === 'string' ? raw.phone.trim() : '';
  const reason = typeof raw.reason === 'string' ? raw.reason.trim() : '';
  const details = typeof raw.details === 'string' ? raw.details.trim() : '';

  const errors: Record<string, string> = {};

  if (referenceIdRaw && !REFERENCE_ID_PATTERN.test(referenceIdRaw)) {
    errors.referenceId = 'Invalid inquiry reference format.';
  }
  if (name.length < 2 || name.length > 120) {
    errors.name = 'Please enter your name (2–120 characters).';
  }
  if (company.length > 120) {
    errors.company = 'Company name must be under 120 characters.';
  }
  if (!email || email.length > 180 || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Please provide a valid email address.';
  }
  if (phone && (phone.length > 30 || !PHONE_PATTERN.test(phone))) {
    errors.phone = 'Please enter a valid phone number (7–30 digits/symbols).';
  }
  if (reason.length > 120) {
    errors.reason = 'Selected scope is too long.';
  }
  if (details.length < 10 || details.length > 3000) {
    errors.details = 'Please share a brief overview of your project (at least 10 characters).';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      referenceId: referenceIdRaw || undefined,
      name,
      company,
      email,
      phone,
      reason: reason || 'Project Inquiry',
      details,
    },
  };
}

async function sendResendEmailNotification(params: {
  referenceId: string;
  receivedAt: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  reason: string;
  details: string;
}): Promise<{ emailSent: boolean; emailStatus: 'sent' | 'not_configured' | 'failed' }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { emailSent: false, emailStatus: 'not_configured' };
  }

  const fromAddress =
    process.env.RESEND_FROM_EMAIL?.trim() || 'CATALYS Studio <onboarding@resend.dev>';

  const safeName = escapeHtml(params.name);
  const safeCompany = escapeHtml(params.company || 'Not specified');
  const safeEmail = escapeHtml(params.email);
  const safePhone = escapeHtml(params.phone || 'Not provided');
  const safeReason = escapeHtml(params.reason);
  const safeDetails = escapeHtml(params.details).replaceAll('\n', '<br />');
  const safeRef = escapeHtml(params.referenceId);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #070709; color: #ffffff; padding: 32px;">
      <div style="max-width: 600px; margin: 0 auto; background: #111114; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px;">
        <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888888;">CATALYS — NEW CLIENT INQUIRY</p>
        <h1 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #ffffff;">${safeName}</h1>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #888888; width: 120px;">Reference</td><td style="padding: 6px 0; color: #ffffff; font-family: monospace;">${safeRef}</td></tr>
          <tr><td style="padding: 6px 0; color: #888888;">Email</td><td style="padding: 6px 0; color: #ffffff;">${safeEmail}</td></tr>
          <tr><td style="padding: 6px 0; color: #888888;">Phone</td><td style="padding: 6px 0; color: #ffffff;">${safePhone}</td></tr>
          <tr><td style="padding: 6px 0; color: #888888;">Company</td><td style="padding: 6px 0; color: #ffffff;">${safeCompany}</td></tr>
          <tr><td style="padding: 6px 0; color: #888888;">Scope</td><td style="padding: 6px 0; color: #ffffff;">${safeReason}</td></tr>
        </table>
        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
          <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #888888;">Project Details</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e5e5e5;">${safeDetails}</p>
        </div>
      </div>
    </div>
  `.trim();

  const text = [
    `CATALYS — New Client Inquiry (${params.referenceId})`,
    `Name: ${params.name}`,
    `Email: ${params.email}`,
    `Phone: ${params.phone || 'Not provided'}`,
    `Company: ${params.company || 'Not specified'}`,
    `Scope: ${params.reason}`,
    `Received: ${params.receivedAt}`,
    '',
    'Project Details:',
    params.details,
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [STUDIO_INBOX_EMAIL],
        reply_to: params.email,
        subject: `[CATALYS] New Inquiry (${params.referenceId}) — ${params.name}`,
        html,
        text,
      }),
    });

    if (!response.ok) {
      console.error(`Resend email delivery failed with status ${response.status}`);
      return { emailSent: false, emailStatus: 'failed' };
    }

    return { emailSent: true, emailStatus: 'sent' };
  } catch (error) {
    console.error('Resend email delivery error:', error instanceof Error ? error.message : 'Unknown error');
    return { emailSent: false, emailStatus: 'failed' };
  }
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use('/api', express.json({ limit: '16kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: 'catalys-studio',
      emailNotificationsConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    });
  });

  app.post('/api/contact', async (req: Request, res: Response) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        message: 'Too many inquiries sent recently. Please wait a few minutes or email directly.',
      });
      return;
    }

    const result = validateContactPayload(req.body);
    if (!result.valid) {
      res.status(400).json({
        ok: false,
        message: 'Please review the highlighted fields and try again.',
        errors: result.errors,
      });
      return;
    }

    const referenceId =
      result.data.referenceId || `CTY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const receivedAt = new Date().toISOString();

    const emailResult = await sendResendEmailNotification({
      referenceId,
      receivedAt,
      name: result.data.name,
      company: result.data.company,
      email: result.data.email,
      phone: result.data.phone,
      reason: result.data.reason,
      details: result.data.details,
    });

    console.info(
      JSON.stringify({
        event: 'studio_contact_inquiry',
        referenceId,
        receivedAt,
        name: result.data.name,
        company: result.data.company || null,
        email: result.data.email,
        phone: result.data.phone || null,
        reason: result.data.reason,
        emailStatus: emailResult.emailStatus,
      })
    );

    res.status(201).json({
      ok: true,
      referenceId,
      receivedAt,
      emailSent: emailResult.emailSent,
      emailStatus: emailResult.emailStatus,
      message: 'Inquiry received. We will review and get back to you shortly.',
    });
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ ok: false, message: 'Endpoint not found.' });
  });

  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req: Request, res: Response, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(__dirname, 'index.html');
        const template = fs.readFileSync(indexPath, 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CATALYS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
