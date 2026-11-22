import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ClientLogoMarquee, ReviewCard } from '../components/EditorialSections';
import { StartProjectBanner } from '../components/StartProjectBanner';
import { reviews, siteConfig } from '../data/content';
import { Link } from '../lib/router';

export function ReviewsPage() {
  const hasReviews = reviews.length > 0;

  return (
    <div>
      <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500">
          Reviews
        </p>
        <h1 className="mt-4 max-w-3xl text-[clamp(2.25rem,5vw,4.25rem)] font-medium tracking-[-0.035em] leading-[1.06] text-white">
          {siteConfig.reviewsHeadline}
        </h1>

        <div className="mt-8">
          <ClientLogoMarquee compact />
        </div>

        {hasReviews ? (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl bg-[#111114] border border-white/[0.08] p-8 sm:p-12 max-w-2xl">
            <h2 className="text-xl font-medium tracking-tight text-white">
              No client reviews published yet.
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#888888]">
              We publish strictly verified client testimonials. Once real reviews are added to{' '}
              <span className="font-mono text-xs text-neutral-300">src/data/content.ts</span>,
              they will populate this grid and enable the Reviews link in the navigation bar
              automatically.
            </p>
            <div className="mt-7">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#070709] hover:bg-neutral-200 transition-colors duration-150 whitespace-nowrap"
              >
                <span>Start a conversation</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      <StartProjectBanner />
    </div>
  );
}
