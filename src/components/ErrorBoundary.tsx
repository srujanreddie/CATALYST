import React from 'react';
import { FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../lib/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Application boundary caught error:', error);
  }

  private getFriendlyDetails(): { title: string; message: string; upgradeUrl?: string } {
    const raw = this.state.errorMessage;
    let extractedError = raw;

    try {
      const parsed = JSON.parse(raw) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed.error === 'string') {
        extractedError = parsed.error;
      }
    } catch {
      // Non-JSON error message
    }

    if (
      extractedError.includes(
        "Quota exceeded for quota metric 'Free daily read units per project (free tier database)'"
      )
    ) {
      return {
        title: 'Firestore daily read quota reached',
        message:
          'Your Firebase free-tier daily read quota has been exceeded. Quota resets tomorrow, or you can review database usage in the Firebase Console.',
        upgradeUrl: `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIRESTORE_DATABASE_ID}/data?openUpgradeDialog=true`,
      };
    }

    if (extractedError.toLowerCase().includes('quota exceeded')) {
      return {
        title: 'Database quota reached',
        message:
          'Firestore usage quota has been exceeded for today. Quota resets the next day under the Firebase Spark free tier.',
      };
    }

    if (extractedError.toLowerCase().includes('insufficient permissions')) {
      return {
        title: 'Access restricted',
        message:
          'Your account does not have permission to perform this database action. Verify you are signed in with an authorized studio admin account.',
      };
    }

    return {
      title: 'Something went wrong',
      message: 'We encountered an unexpected application error. Please reload to continue.',
    };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const details = this.getFriendlyDetails();

    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg rounded-2xl bg-[#111114] border border-white/[0.08] p-8 sm:p-10">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500">
            CATALYS
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {details.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#888888]">{details.message}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#070709] hover:bg-neutral-200 transition-colors"
            >
              Reload Page
            </button>
            {details.upgradeUrl && (
              <a
                href={details.upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/[0.12] px-4 py-2.5 text-sm font-medium text-neutral-200 hover:text-white hover:border-white/25 transition-colors"
              >
                Open Firebase Console
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
}
