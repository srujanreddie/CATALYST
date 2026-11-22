import React, { useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { AlertCircle, Check, Copy, Loader2, Mail } from 'lucide-react';
import { ClientLogoMarquee } from '../components/EditorialSections';
import { StartProjectBanner } from '../components/StartProjectBanner';
import { clientLogos, services, siteConfig } from '../data/content';
import {
  db,
  generateInquiryReferenceId,
  handleFirestoreError,
  INQUIRY_LIMITS,
  OperationType,
} from '../lib/firebase';

interface FormValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  reason: string;
  details: string;
}

interface SubmissionReceipt {
  referenceId: string;
  receivedAt: string;
  name: string;
  email: string;
}

const INITIAL_FORM: FormValues = {
  name: '',
  company: '',
  email: '',
  phone: '',
  reason: '',
  details: '',
};

export function ContactPage() {
  const [values, setValues] = useState<FormValues>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const reasonOptions = [
    ...services.map((s) => s.title),
    'Full-Stack & Motion Partnership',
    'General Inquiry',
  ];

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};
    const name = values.name.trim();
    const company = values.company.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    const reason = values.reason.trim();
    const details = values.details.trim();

    if (name.length < INQUIRY_LIMITS.nameMin || name.length > INQUIRY_LIMITS.nameMax) {
      errors.name = `Please enter your name (${INQUIRY_LIMITS.nameMin}–${INQUIRY_LIMITS.nameMax} characters).`;
    }
    if (company.length > INQUIRY_LIMITS.companyMax) {
      errors.company = `Company name must be under ${INQUIRY_LIMITS.companyMax} characters.`;
    }
    if (
      email.length < INQUIRY_LIMITS.emailMin ||
      email.length > INQUIRY_LIMITS.emailMax ||
      !INQUIRY_LIMITS.emailPattern.test(email)
    ) {
      errors.email = 'Please enter a valid email address.';
    }
    if (phone && (phone.length > INQUIRY_LIMITS.phoneMax || !INQUIRY_LIMITS.phonePattern.test(phone))) {
      errors.phone = 'Please enter a valid phone number (e.g., +1 555 234 5678).';
    }
    if (reason.length > INQUIRY_LIMITS.reasonMax) {
      errors.reason = `Selected scope must be under ${INQUIRY_LIMITS.reasonMax} characters.`;
    }
    if (details.length < INQUIRY_LIMITS.detailsMin || details.length > INQUIRY_LIMITS.detailsMax) {
      errors.details = `Please share a few details about your project (${INQUIRY_LIMITS.detailsMin}–${INQUIRY_LIMITS.detailsMax} characters).`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    if (!validateClientSide()) {
      return;
    }

    const sanitizedName = values.name.trim().slice(0, INQUIRY_LIMITS.nameMax);
    const sanitizedCompany = values.company.trim().slice(0, INQUIRY_LIMITS.companyMax);
    const sanitizedEmail = values.email.trim().slice(0, INQUIRY_LIMITS.emailMax);
    const sanitizedPhone = values.phone.trim().slice(0, INQUIRY_LIMITS.phoneMax);
    const sanitizedReason = (values.reason.trim() || 'Project Inquiry').slice(
      0,
      INQUIRY_LIMITS.reasonMax
    );
    const sanitizedDetails = values.details.trim().slice(0, INQUIRY_LIMITS.detailsMax);
    const referenceId = generateInquiryReferenceId();
    const inquiryPath = `inquiries/${referenceId}`;

    setIsSubmitting(true);
    try {
      // 1. Persist inquiry permanently in Firestore (primary source of truth for /admin inbox)
      try {
        await setDoc(doc(db, 'inquiries', referenceId), {
          referenceId,
          name: sanitizedName,
          company: sanitizedCompany,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          reason: sanitizedReason,
          details: sanitizedDetails,
          status: 'new',
          createdAt: serverTimestamp(),
        });
      } catch (firestoreError) {
        const message =
          firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
        if (message.toLowerCase().includes('quota exceeded')) {
          setSubmitError(
            `Our inquiry inbox has reached its daily quota. Please email us directly at ${siteConfig.contactEmail}.`
          );
          return;
        }
        handleFirestoreError(firestoreError, OperationType.CREATE, inquiryPath);
      }

      // 2. Trigger server-side email alert to gokasrujanreddy@gmail.com (non-blocking if Resend key isn't set yet)
      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            referenceId,
            name: sanitizedName,
            company: sanitizedCompany,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            reason: sanitizedReason,
            details: sanitizedDetails,
          }),
        });
      } catch {
        // Inquiry is already persisted safely in Firestore; never lose user confirmation on email network hiccup
      }

      setReceipt({
        referenceId,
        receivedAt: new Date().toISOString(),
        name: sanitizedName,
        email: sanitizedEmail,
      });
      setValues(INITIAL_FORM);
      setFieldErrors({});
    } catch {
      setSubmitError(
        `We couldn't submit your inquiry right now. Please try again or email us directly at ${siteConfig.contactEmail}.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.contactEmail);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(false);
    }
  };

  return (
    <div>
      <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Left Column: Headline, Intro, Direct Contact */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500">
                Contact
              </p>
              <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.25rem)] font-medium tracking-[-0.035em] leading-[1.04] text-white">
                {siteConfig.contactHeadline}
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#888888] max-w-md">
                {siteConfig.contactSubcopy}
              </p>
            </div>

            {/* Direct Email Channel */}
            <div className="mt-10 pt-8 border-t border-white/[0.08]">
              <p className="text-xs font-medium tracking-[0.16em] uppercase text-neutral-500">
                Direct Email
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="inline-flex items-center gap-2 text-base font-medium text-white hover:text-neutral-300 transition-colors break-all"
                >
                  <Mail className="h-4 w-4 text-neutral-400 shrink-0" aria-hidden="true" />
                  <span>{siteConfig.contactEmail}</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label="Copy email address"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#111114] border border-white/[0.1] px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:border-white/[0.2] transition-colors whitespace-nowrap"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Conditional Partner Logos (strictly hidden if clientLogos is empty) */}
            {clientLogos.length > 0 && (
              <div className="mt-10 pt-8 border-t border-white/[0.08]">
                <p className="text-xs font-medium tracking-[0.16em] uppercase text-neutral-500 mb-3">
                  Partners
                </p>
                <ClientLogoMarquee compact />
              </div>
            )}
          </div>

          {/* Right Column: Sleek Dark-Mode Bordered Form Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-[#111114] border border-white/[0.08] p-6 sm:p-9 lg:p-10">
              {receipt ? (
                <div className="py-6">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#070709] mb-6">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                    Message received.
                  </h2>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-neutral-300 max-w-lg">
                    Thank you, {receipt.name}. Your inquiry has been saved to the CATALYS studio
                    inbox and we will respond to <span className="text-white">{receipt.email}</span>{' '}
                    shortly.
                  </p>

                  <div className="mt-6 rounded-xl bg-[#070709] border border-white/[0.08] px-4 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[#888888]">Reference ID</span>
                    <span className="font-mono font-medium text-white tabular-nums">
                      {receipt.referenceId}
                    </span>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#070709] hover:bg-neutral-200 transition-colors duration-150 whitespace-nowrap"
                    >
                      Send Another Message
                    </button>
                    <a
                      href={`mailto:${siteConfig.contactEmail}`}
                      className="text-sm text-[#888888] hover:text-white transition-colors"
                    >
                      Or email directly
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {submitError && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-400/25 px-4 py-3.5 text-sm text-red-200"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-300" aria-hidden="true" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-medium text-neutral-400 mb-2"
                      >
                        Your Name <span className="text-neutral-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        maxLength={INQUIRY_LIMITS.nameMax}
                        required
                        value={values.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        aria-invalid={Boolean(fieldErrors.name)}
                        className={`w-full rounded-xl bg-[#070709] border px-4 py-3 text-sm text-white placeholder:text-neutral-600 transition-colors focus:outline-none focus:border-white/40 ${
                          fieldErrors.name ? 'border-red-400/60' : 'border-white/[0.08]'
                        }`}
                      />
                      {fieldErrors.name && (
                        <p className="mt-1.5 text-xs text-red-300">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-company"
                        className="block text-xs font-medium text-neutral-400 mb-2"
                      >
                        Company Name
                      </label>
                      <input
                        id="contact-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        maxLength={INQUIRY_LIMITS.companyMax}
                        value={values.company}
                        onChange={handleChange}
                        placeholder="Optional"
                        className="w-full rounded-xl bg-[#070709] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-neutral-600 transition-colors focus:outline-none focus:border-white/40"
                      />
                      {fieldErrors.company && (
                        <p className="mt-1.5 text-xs text-red-300">{fieldErrors.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-medium text-neutral-400 mb-2"
                      >
                        Email <span className="text-neutral-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        maxLength={INQUIRY_LIMITS.emailMax}
                        required
                        value={values.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        className={`w-full rounded-xl bg-[#070709] border px-4 py-3 text-sm text-white placeholder:text-neutral-600 transition-colors focus:outline-none focus:border-white/40 ${
                          fieldErrors.email ? 'border-red-400/60' : 'border-white/[0.08]'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="mt-1.5 text-xs text-red-300">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-xs font-medium text-neutral-400 mb-2"
                      >
                        Phone Number
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        maxLength={INQUIRY_LIMITS.phoneMax}
                        value={values.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000 (Optional)"
                        aria-invalid={Boolean(fieldErrors.phone)}
                        className={`w-full rounded-xl bg-[#070709] border px-4 py-3 text-sm text-white placeholder:text-neutral-600 transition-colors focus:outline-none focus:border-white/40 ${
                          fieldErrors.phone ? 'border-red-400/60' : 'border-white/[0.08]'
                        }`}
                      />
                      {fieldErrors.phone && (
                        <p className="mt-1.5 text-xs text-red-300">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-reason"
                      className="block text-xs font-medium text-neutral-400 mb-2"
                    >
                      Scope
                    </label>
                    <select
                      id="contact-reason"
                      name="reason"
                      value={values.reason}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-[#070709] border border-white/[0.08] px-4 py-3 text-sm text-white transition-colors focus:outline-none focus:border-white/40"
                    >
                      <option value="" className="bg-[#111114] text-neutral-400">
                        Select a focus area
                      </option>
                      {reasonOptions.map((option) => (
                        <option key={option} value={option} className="bg-[#111114] text-white">
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-details"
                      className="block text-xs font-medium text-neutral-400 mb-2"
                    >
                      Project Details <span className="text-neutral-500">*</span>
                    </label>
                    <textarea
                      id="contact-details"
                      name="details"
                      rows={5}
                      maxLength={INQUIRY_LIMITS.detailsMax}
                      required
                      value={values.details}
                      onChange={handleChange}
                      placeholder="Tell us about your goals, timeline, and what you are looking to build."
                      aria-invalid={Boolean(fieldErrors.details)}
                      className={`w-full resize-y rounded-xl bg-[#070709] border px-4 py-3 text-sm text-white placeholder:text-neutral-600 transition-colors focus:outline-none focus:border-white/40 ${
                        fieldErrors.details ? 'border-red-400/60' : 'border-white/[0.08]'
                      }`}
                    />
                    {fieldErrors.details && (
                      <p className="mt-1.5 text-xs text-red-300">{fieldErrors.details}</p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#070709] transition-colors duration-150 hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111114]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>

                    <p className="text-xs text-[#888888]">
                      Direct inquiries go to{' '}
                      <span className="text-neutral-300">{siteConfig.contactEmail}</span>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <StartProjectBanner />
    </div>
  );
}
