import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Copy,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Search,
  Trash2,
} from 'lucide-react';
import { Monogram } from '../components/Monogram';
import {
  ADMIN_EMAILS,
  db,
  handleFirestoreError,
  INQUIRY_STATUSES,
  type InquiryStatus,
  OperationType,
} from '../lib/firebase';
import { useFirebase } from '../lib/FirebaseProvider';
import { Link } from '../lib/router';

interface StoredInquiry {
  id: string;
  referenceId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  reason: string;
  details: string;
  status: InquiryStatus;
  createdAt: Timestamp | null;
}

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  replied: 'Replied',
  archived: 'Archived',
};

const STATUS_TEXT_CLASS: Record<InquiryStatus, string> = {
  new: 'text-white',
  reviewed: 'text-amber-300',
  replied: 'text-emerald-400',
  archived: 'text-neutral-500',
};

function formatDate(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Just now';
  const date = ts.toDate();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatShortDate(ts: Timestamp | null): string {
  if (!ts || typeof ts.toDate !== 'function') return 'Now';
  const date = ts.toDate();
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function AdminPage() {
  const { user, isAuthReady, isAdmin, authBusy, authError, signInWithGoogle, signOutUser } =
    useFirebase();

  const [inquiries, setInquiries] = useState<StoredInquiry[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [emailNotificationsConfigured, setEmailNotificationsConfigured] = useState<boolean | null>(
    null
  );

  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Surface Firestore errors cleanly to ErrorBoundary
  if (fatalError) {
    throw fatalError;
  }

  // Check server health once when admin is signed in to show whether RESEND_API_KEY is active
  useEffect(() => {
    if (!isAuthReady || !isAdmin) return;
    let active = true;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: { emailNotificationsConfigured?: boolean }) => {
        if (active && typeof data.emailNotificationsConfigured === 'boolean') {
          setEmailNotificationsConfigured(data.emailNotificationsConfigured);
        }
      })
      .catch(() => {
        // Non-critical indicator
      });
    return () => {
      active = false;
    };
  }, [isAuthReady, isAdmin]);

  // Attach real-time Firestore listener ONLY once auth is ready AND user is verified admin
  useEffect(() => {
    if (!isAuthReady || !isAdmin) {
      setInquiries([]);
      setLoadingInbox(false);
      return;
    }

    setLoadingInbox(true);
    const inquiriesQuery = query(
      collection(db, 'inquiries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      inquiriesQuery,
      (snapshot) => {
        const rows: StoredInquiry[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const rawStatus = typeof data.status === 'string' ? data.status : 'new';
          const status: InquiryStatus = (INQUIRY_STATUSES as readonly string[]).includes(
            rawStatus
          )
            ? (rawStatus as InquiryStatus)
            : 'new';

          return {
            id: docSnap.id,
            referenceId: typeof data.referenceId === 'string' ? data.referenceId : docSnap.id,
            name: typeof data.name === 'string' ? data.name : 'Unknown',
            company: typeof data.company === 'string' ? data.company : '',
            email: typeof data.email === 'string' ? data.email : '',
            phone: typeof data.phone === 'string' ? data.phone : '',
            reason: typeof data.reason === 'string' ? data.reason : 'Project Inquiry',
            details: typeof data.details === 'string' ? data.details : '',
            status,
            createdAt: (data.createdAt as Timestamp | null) ?? null,
          };
        });

        setInquiries(rows);
        setLoadingInbox(false);
      },
      (error) => {
        setLoadingInbox(false);
        try {
          handleFirestoreError(error, OperationType.LIST, 'inquiries');
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, isAdmin]);

  const filteredInquiries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inquiries.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.referenceId.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q)
      );
    });
  }, [inquiries, statusFilter, searchQuery]);

  // Keep selected inquiry synchronized with filtered list
  useEffect(() => {
    if (filteredInquiries.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredInquiries.some((item) => item.id === selectedId)) {
      setSelectedId(filteredInquiries[0].id);
    }
  }, [filteredInquiries, selectedId]);

  const selectedInquiry = useMemo(
    () => filteredInquiries.find((item) => item.id === selectedId) ?? null,
    [filteredInquiries, selectedId]
  );

  const counts = useMemo(() => {
    let newCount = 0;
    let repliedCount = 0;
    for (const item of inquiries) {
      if (item.status === 'new') newCount += 1;
      if (item.status === 'replied') repliedCount += 1;
    }
    return {
      total: inquiries.length,
      newCount,
      repliedCount,
    };
  }, [inquiries]);

  const handleStatusChange = async (inquiry: StoredInquiry, nextStatus: InquiryStatus) => {
    if (inquiry.status === nextStatus) return;
    setActionError(null);
    setMutatingId(inquiry.id);
    const path = `inquiries/${inquiry.id}`;
    try {
      await updateDoc(doc(db, 'inquiries', inquiry.id), { status: nextStatus });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } catch {
        setActionError('Unable to update inquiry status. Please verify your permissions and retry.');
      }
    } finally {
      setMutatingId(null);
    }
  };

  const handleDeleteInquiry = async (inquiry: StoredInquiry) => {
    setActionError(null);
    setMutatingId(inquiry.id);
    const path = `inquiries/${inquiry.id}`;
    try {
      await deleteDoc(doc(db, 'inquiries', inquiry.id));
      setConfirmDeleteId(null);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch {
        setActionError('Unable to delete this inquiry right now. Please try again.');
      }
    } finally {
      setMutatingId(null);
    }
  };

  const handleCopyEmail = async (inquiry: StoredInquiry) => {
    try {
      await navigator.clipboard.writeText(inquiry.email);
      setCopiedId(inquiry.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  // State 1: Waiting for Firebase Auth initialization
  if (!isAuthReady) {
    return (
      <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-24">
        <div className="mx-auto max-w-md rounded-2xl bg-[#111114] border border-white/[0.08] p-10 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" aria-hidden="true" />
          <p className="mt-4 text-sm text-[#888888]">Checking studio session...</p>
        </div>
      </section>
    );
  }

  // State 2: Signed out gate
  if (!user) {
    return (
      <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-20 sm:py-28">
        <div className="mx-auto max-w-md rounded-2xl bg-[#111114] border border-white/[0.08] p-8 sm:p-10">
          <div className="flex items-center justify-between">
            <Monogram className="h-6 w-auto text-white" />
            <Lock className="h-4 w-4 text-neutral-500" aria-hidden="true" />
          </div>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-white">
            Studio Admin Inbox
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-[#888888]">
            Sign in with your authorized Google account to view and manage incoming client
            inquiries submitted through CATALYS.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-400/25 px-3.5 py-3 text-xs text-red-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-300" aria-hidden="true" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={authBusy}
            onClick={signInWithGoogle}
            className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#070709] hover:bg-neutral-200 transition-colors duration-150 disabled:opacity-60"
          >
            {authBusy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in with Google</span>
            )}
          </button>
        </div>
      </section>
    );
  }

  // State 3: Signed in with a non-admin Google account
  if (!isAdmin) {
    return (
      <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-20 sm:py-28">
        <div className="mx-auto max-w-lg rounded-2xl bg-[#111114] border border-white/[0.08] p-8 sm:p-10">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500">
            Access Restricted
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Authorized studio admins only.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#888888]">
            You are currently signed in as{' '}
            <span className="text-neutral-200">{user.email || 'an unrecognized account'}</span>.
            Client inquiries are restricted strictly to authorized CATALYS accounts (
            {ADMIN_EMAILS.join(', ')}).
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={authBusy}
              onClick={signOutUser}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#070709] hover:bg-neutral-200 transition-colors"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
            <Link
              to="/"
              className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-neutral-300 hover:text-white hover:border-white/25 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // State 4: Authenticated Studio Admin Inbox
  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-10 pb-20 sm:pt-14 sm:pb-24">
      {/* Header Row */}
      <div className="flex flex-col gap-6 pb-8 border-b border-white/[0.08] lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500">
            Admin Inbox
          </p>
          <h1 className="mt-3 text-[clamp(2rem,3.6vw,3rem)] font-medium tracking-[-0.03em] leading-tight text-white">
            Client Inquiries
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* Compact Tabular Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-neutral-500 block">Total</span>
              <span className="font-mono text-lg font-medium text-white tabular-nums">
                {counts.total}
              </span>
            </div>
            <div className="h-7 w-px bg-white/[0.08]" aria-hidden="true" />
            <div>
              <span className="text-xs text-neutral-500 block">New</span>
              <span className="font-mono text-lg font-medium text-white tabular-nums">
                {counts.newCount}
              </span>
            </div>
            <div className="h-7 w-px bg-white/[0.08]" aria-hidden="true" />
            <div>
              <span className="text-xs text-neutral-500 block">Replied</span>
              <span className="font-mono text-lg font-medium text-emerald-400 tabular-nums">
                {counts.repliedCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-0 lg:pl-4 lg:border-l lg:border-white/[0.08]">
            <span className="text-xs text-[#888888] hidden sm:inline truncate max-w-[200px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={signOutUser}
              disabled={authBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#111114] border border-white/[0.1] px-3.5 py-2 text-xs font-medium text-neutral-200 hover:text-white hover:border-white/25 transition-colors whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Email Configuration Notice (only shown if RESEND_API_KEY is not configured yet) */}
      {emailNotificationsConfigured === false && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-[#111114] border border-white/[0.08] px-5 py-3.5 text-xs text-neutral-300">
          <p>
            Firestore inbox is active and saving every lead. To also receive instant email alerts at{' '}
            <span className="text-white">gokasrujanreddy@gmail.com</span>, add{' '}
            <span className="font-mono text-white">RESEND_API_KEY</span> in AI Studio Secrets.
          </p>
          <span className="font-mono text-[11px] text-neutral-500 whitespace-nowrap shrink-0">
            Email alerts pending key
          </span>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mt-6 flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-400/25 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search & Segmented Status Filter Bar */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, email, or ref..."
            aria-label="Search inquiries"
            className="w-full rounded-xl bg-[#111114] border border-white/[0.08] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/35 transition-colors"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filter inquiries by status"
          className="flex flex-wrap items-center gap-1 rounded-xl bg-[#111114] border border-white/[0.08] p-1"
        >
          {(['all', ...INQUIRY_STATUSES] as const).map((status) => {
            const active = statusFilter === status;
            const label = status === 'all' ? 'All' : STATUS_LABELS[status];
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                  active ? 'bg-white text-[#070709]' : 'text-[#888888] hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Inbox View */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Inquiry List */}
        <div className="lg:col-span-5 rounded-2xl bg-[#111114] border border-white/[0.08] overflow-hidden">
          {loadingInbox ? (
            <div className="divide-y divide-white/[0.06]">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="p-5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-white/[0.08]" />
                    <div className="h-3 w-16 rounded bg-white/[0.06]" />
                  </div>
                  <div className="mt-2.5 h-3 w-48 rounded bg-white/[0.05]" />
                  <div className="mt-3 h-3 w-full rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-neutral-400">
                <Inbox className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-white">
                {inquiries.length === 0
                  ? 'No inquiries received yet.'
                  : 'No inquiries match your filter.'}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#888888]">
                {inquiries.length === 0
                  ? 'When prospective clients submit the Contact form, their messages will appear here in real time.'
                  : 'Try clearing your search term or switching the status filter.'}
              </p>
              {inquiries.length === 0 && (
                <div className="mt-6">
                  <Link
                    to="/contact"
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-neutral-300 transition-colors"
                  >
                    <span>Test the Contact Form</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] max-h-[680px] overflow-y-auto">
              {filteredInquiries.map((item) => {
                const isSelected = selectedInquiry?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setConfirmDeleteId(null);
                    }}
                    className={`w-full text-left p-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60 ${
                      isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500 tabular-nums shrink-0">
                        {formatShortDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-[#888888] truncate">
                      <span>{item.company || item.email}</span>
                      <span aria-hidden="true">·</span>
                      <span className={STATUS_TEXT_CLASS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-neutral-400 line-clamp-2">
                      {item.details}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="truncate">{item.reason}</span>
                      <span className="font-mono tabular-nums shrink-0 ml-2">
                        {item.referenceId}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Reading & Triage Pane */}
        <div className="lg:col-span-7 rounded-2xl bg-[#111114] border border-white/[0.08] p-6 sm:p-8 min-h-[420px]">
          {selectedInquiry ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#888888]">
                    <span className="font-mono text-neutral-300 tabular-nums">
                      {selectedInquiry.referenceId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatDate(selectedInquiry.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-white">
                    {selectedInquiry.name}
                  </h2>
                  {selectedInquiry.company && (
                    <p className="mt-1 text-sm text-[#888888]">{selectedInquiry.company}</p>
                  )}
                </div>

                {/* Reply + Copy Email Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={`mailto:${encodeURIComponent(selectedInquiry.email)}?subject=${encodeURIComponent(
                      `[CATALYS] Re: ${selectedInquiry.referenceId} — ${selectedInquiry.reason}`
                    )}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#070709] hover:bg-neutral-200 transition-colors whitespace-nowrap"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reply via Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(selectedInquiry)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#070709] border border-white/[0.1] px-3.5 py-2 text-xs font-medium text-neutral-200 hover:text-white hover:border-white/25 transition-colors whitespace-nowrap"
                  >
                    {copiedId === selectedInquiry.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Metadata Grid */}
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-b border-white/[0.08] text-sm">
                <div>
                  <dt className="text-xs text-neutral-500">Email</dt>
                  <dd className="mt-1 text-neutral-200 break-all">{selectedInquiry.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Phone</dt>
                  <dd className="mt-1 font-mono text-neutral-200 tabular-nums">
                    {selectedInquiry.phone ? (
                      <a
                        href={`tel:${selectedInquiry.phone.replace(/[^\d+]/g, '')}`}
                        className="hover:text-white underline decoration-white/20 underline-offset-4 transition-colors"
                      >
                        {selectedInquiry.phone}
                      </a>
                    ) : (
                      <span className="font-sans text-neutral-500">Not provided</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Scope</dt>
                  <dd className="mt-1 text-neutral-200">{selectedInquiry.reason}</dd>
                </div>
              </dl>

              {/* Message Body */}
              <div className="py-6 border-b border-white/[0.08]">
                <p className="text-xs font-medium tracking-[0.16em] uppercase text-neutral-500 mb-3">
                  Project Details
                </p>
                <p className="text-sm sm:text-[15px] leading-relaxed text-neutral-200 whitespace-pre-wrap">
                  {selectedInquiry.details}
                </p>
              </div>

              {/* Status Triage & Delete Controls */}
              <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-neutral-500 mr-1">Status:</span>
                  {INQUIRY_STATUSES.map((status) => {
                    const isCurrent = selectedInquiry.status === status;
                    const busy = mutatingId === selectedInquiry.id;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusChange(selectedInquiry, status)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-50 ${
                          isCurrent
                            ? 'bg-white text-[#070709]'
                            : 'bg-[#070709] border border-white/[0.08] text-neutral-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    );
                  })}
                </div>

                {/* Safe Two-Step Delete */}
                <div className="flex items-center gap-2">
                  {confirmDeleteId === selectedInquiry.id ? (
                    <>
                      <button
                        type="button"
                        disabled={mutatingId === selectedInquiry.id}
                        onClick={() => handleDeleteInquiry(selectedInquiry)}
                        className="rounded-lg bg-red-500/20 border border-red-400/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 transition-colors whitespace-nowrap"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedInquiry.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-red-300 hover:bg-red-500/10 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <p className="text-sm text-[#888888]">
                {loadingInbox
                  ? 'Loading inquiries...'
                  : 'Select an inquiry from the list to inspect full details.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
