import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useInView, useReducedMotion } from 'motion/react';
import {
  clientLogos,
  metrics,
  reviews,
  services,
  siteConfig,
  type Metric,
  type Review,
} from '../data/content';
import { Link } from '../lib/router';

/**
 * 1. Client Logo Marquee (strictly hidden when `clientLogos` is empty)
 */
export function ClientLogoMarquee({ compact = false }: { compact?: boolean }) {
  if (clientLogos.length === 0) return null;

  const repeated = [...clientLogos, ...clientLogos, ...clientLogos, ...clientLogos];

  return (
    <div
      aria-label="Client Partners"
      className={`relative w-full overflow-hidden ${
        compact ? 'py-4' : 'py-10 border-b border-white/[0.06]'
      }`}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#070709] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#070709] to-transparent" />

      <div className="animate-marquee items-center gap-12 sm:gap-16">
        {repeated.map((client, idx) => (
          <div
            key={`${client.id}-${idx}`}
            className="flex shrink-0 items-center justify-center opacity-55 hover:opacity-100 transition-opacity duration-200"
          >
            {client.logoSrc ? (
              <img
                src={client.logoSrc}
                alt={client.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-6 sm:h-7 w-auto object-contain grayscale brightness-200"
              />
            ) : (
              <span className="text-sm sm:text-base font-semibold tracking-tight text-neutral-300 whitespace-nowrap">
                {client.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. Solutions / Services Section
 */
export function SolutionsSection() {
  if (services.length === 0) return null;

  return (
    <section
      id="solutions"
      aria-labelledby="solutions-heading"
      className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-20 sm:py-28"
    >
      <p
        id="solutions-heading"
        className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-10 sm:mb-14"
      >
        Solutions
      </p>

      <div className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
        {services.map((category) => (
          <div
            key={category.id}
            className="grid grid-cols-1 gap-8 py-12 sm:py-16 lg:grid-cols-12 lg:items-start lg:gap-12"
          >
            {/* Left: Large bold category title */}
            <div className="lg:col-span-5">
              <h2 className="text-[clamp(2.25rem,4.5vw,4rem)] font-semibold tracking-[-0.03em] leading-[1.05] text-white">
                {category.title}
              </h2>
            </div>

            {/* Right: 2-column deliverables list */}
            <div className="lg:col-span-7 lg:pt-2">
              <ul className="grid grid-cols-1 gap-x-10 gap-y-3.5 sm:grid-cols-2">
                {category.deliverables.map((item) => (
                  <li
                    key={item}
                    className="text-sm sm:text-[15px] leading-relaxed text-neutral-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * 3. Editorial Studio Manifesto & Scroll-Focused Pillars (Vision / Intention / Obsession)
 */
export function ManifestoAndPillarsSection() {
  const [activePillarIndex, setActivePillarIndex] = useState(0);
  const pillarRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const elements = pillarRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.pillarIndex);
            if (!Number.isNaN(idx)) {
              setActivePillarIndex(idx);
            }
          }
        });
      },
      {
        rootMargin: '-38% 0px -38% 0px',
        threshold: 0.1,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const activePillar = siteConfig.pillars[activePillarIndex] ?? siteConfig.pillars[0];

  return (
    <>
      {/* Editorial Manifesto Statement */}
      <section
        aria-label="Studio Manifesto"
        className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-8">
            {siteConfig.manifestoEyebrow}
          </p>
          <p className="text-[clamp(1.625rem,3.4vw,2.75rem)] font-medium tracking-[-0.025em] leading-[1.24] text-white">
            {siteConfig.manifestoLead}
          </p>
          <p className="mt-8 text-[clamp(1.125rem,2vw,1.5rem)] font-normal leading-[1.55] text-[#888888]">
            {siteConfig.manifestoBody}
          </p>
        </div>
      </section>

      {/* Scroll-Focused Pillars: Vision / Intention / Obsession */}
      <section
        aria-labelledby="pillars-heading"
        className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-20 sm:py-32 border-t border-white/[0.06]"
      >
        <p
          id="pillars-heading"
          className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-10 sm:mb-14"
        >
          {siteConfig.pillarsEyebrow}
        </p>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left: Giant display pillar words with blur/opacity focus */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6 sm:gap-10">
            {siteConfig.pillars.map((pillar, index) => {
              const isActive = index === activePillarIndex;
              return (
                <button
                  key={pillar.id}
                  ref={(el) => {
                    pillarRefs.current[index] = el;
                  }}
                  data-pillar-index={index}
                  type="button"
                  onClick={() => setActivePillarIndex(index)}
                  onMouseEnter={() => setActivePillarIndex(index)}
                  aria-pressed={isActive}
                  className={`text-left font-semibold tracking-[-0.04em] leading-[1.02] text-[clamp(3rem,8.5vw,6.75rem)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm ${
                    isActive
                      ? 'text-white opacity-100 blur-0 translate-x-0'
                      : prefersReducedMotion
                        ? 'text-white opacity-25'
                        : 'text-white opacity-25 blur-[3px] hover:opacity-55 hover:blur-[1px]'
                  }`}
                >
                  {pillar.title}
                </button>
              );
            })}
          </div>

          {/* Right: Sticky synchronized philosophy copy */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:pt-4">
            <div className="max-w-md border-t border-white/[0.08] pt-6 lg:border-t-0 lg:pt-0">
              <p className="font-mono text-xs text-neutral-500 tabular-nums mb-4">
                0{activePillarIndex + 1} / 0{siteConfig.pillars.length}
              </p>
              <p className="text-base sm:text-lg leading-relaxed text-neutral-300">
                {activePillar.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Animated Count-Up Metric Item
 */
function AnimatedMetric({ metric }: { metric: Metric }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setDisplayValue(metric.value);
      return;
    }

    const duration = 1100;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * metric.value));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, metric.value, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className="flex flex-col justify-between rounded-2xl bg-[#111114] border border-white/[0.08] p-7 sm:p-8"
    >
      <div className="font-mono text-[clamp(2.5rem,4.5vw,3.75rem)] font-medium tracking-tight text-white tabular-nums leading-none">
        {metric.prefix}
        {displayValue.toLocaleString()}
        {metric.suffix}
      </div>
      <div className="mt-6">
        <p className="text-base font-medium text-white">{metric.label}</p>
        {metric.context && (
          <p className="mt-1 text-sm text-[#888888]">{metric.context}</p>
        )}
      </div>
    </div>
  );
}

/**
 * 4. Metrics & Logo Wall (strictly hidden if both `metrics` and `clientLogos` are empty)
 */
export function MetricsAndLogoWall() {
  if (metrics.length === 0 && clientLogos.length === 0) return null;

  return (
    <section
      aria-label="Impact and Partners"
      className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-20 sm:py-28 border-t border-white/[0.06]"
    >
      {metrics.length > 0 && (
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-10">
            By The Numbers
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <AnimatedMetric key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      )}

      {clientLogos.length > 0 && (
        <div className={metrics.length > 0 ? 'mt-20' : ''}>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-10">
            Partners
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-white/[0.08]">
            {clientLogos.map((client) => (
              <div
                key={client.id}
                className="flex h-28 items-center justify-center border-r border-b border-white/[0.08] px-6 opacity-70 hover:opacity-100 transition-opacity duration-200"
              >
                {client.logoSrc ? (
                  <img
                    src={client.logoSrc}
                    alt={client.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="max-h-8 w-auto object-contain grayscale brightness-200"
                  />
                ) : (
                  <span className="text-sm font-semibold tracking-tight text-neutral-200 text-center">
                    {client.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Editorial Review Card
 */
export function ReviewCard({ review }: { review: Review }) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-[#111114] border border-white/[0.08] p-6 sm:p-7">
      <div>
        <div className="flex items-center gap-3.5">
          {review.avatarSrc && !avatarFailed ? (
            <img
              src={review.avatarSrc}
              alt={review.author}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="h-10 w-10 rounded-full object-cover border border-white/[0.1]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-white"
            >
              {review.author
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {review.author}
            </h3>
            <p className="text-xs text-[#888888] truncate">
              {review.role}, {review.company}
            </p>
          </div>
        </div>

        <blockquote className="mt-5 text-sm leading-relaxed text-neutral-300">
          “{review.quote}”
        </blockquote>
      </div>

      {review.companyLogoSrc && (
        <div className="mt-6 pt-5 border-t border-white/[0.06]">
          <img
            src={review.companyLogoSrc}
            alt={review.company}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-5 w-auto object-contain opacity-75 grayscale brightness-200"
          />
        </div>
      )}
    </article>
  );
}

/**
 * 5. Testimonials Preview on Home (strictly hidden when `reviews` is empty)
 */
export function TestimonialsPreviewSection() {
  if (reviews.length === 0) return null;

  const previewReviews = reviews.slice(0, 8);

  return (
    <section
      aria-labelledby="testimonials-preview-heading"
      className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 py-20 sm:py-28 border-t border-white/[0.06]"
    >
      <div className="text-center mb-14">
        <h2
          id="testimonials-preview-heading"
          className="text-[clamp(2rem,4vw,3.25rem)] font-semibold tracking-tight text-white"
        >
          Don&apos;t take our word for it
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {previewReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/reviews"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-neutral-300 transition-colors whitespace-nowrap"
        >
          <span>See All</span>
          <ArrowUpRight className="h-4 w-4 text-neutral-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </Link>
      </div>
    </section>
  );
}
