import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { projects } from '../data/content';
import { Link } from '../lib/router';

export function StartProjectBanner() {
  // Strictly pull real project images from content.ts; omit marquee cleanly if none exist yet.
  const projectsWithImages = projects.filter(
    (project): project is typeof project & { image: string } =>
      Boolean(project.image && project.image.trim().length > 0)
  );

  const marqueeItems =
    projectsWithImages.length > 0
      ? [...projectsWithImages, ...projectsWithImages, ...projectsWithImages, ...projectsWithImages]
      : [];

  return (
    <section
      aria-label="Start a Project"
      className="w-full px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20"
    >
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-3xl bg-white text-[#070709]">
        {/* Top Row: Giant high-contrast CTA link */}
        <Link
          to="/contact"
          className={`group flex items-start justify-between gap-6 px-7 sm:px-12 lg:px-14 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070709] focus-visible:ring-inset ${
            marqueeItems.length > 0
              ? 'pt-10 pb-10 sm:pt-14 sm:pb-12'
              : 'py-14 sm:py-20 lg:py-24'
          }`}
        >
          <div className="max-w-4xl">
            <h2 className="text-[clamp(2.5rem,7.2vw,6.25rem)] font-medium tracking-[-0.04em] leading-[0.98] text-[#070709]">
              Start a Project
            </h2>
          </div>

          <span
            aria-hidden="true"
            className="mt-1 sm:mt-2 inline-flex shrink-0 items-center justify-center text-[#888888] transition-all duration-200 ease-out group-hover:translate-x-1.5 group-hover:-translate-y-1.5 group-hover:text-[#070709]"
          >
            <ArrowUpRight className="h-9 w-9 sm:h-12 sm:w-12 lg:h-14 lg:w-14 stroke-[1.75]" />
          </span>
        </Link>

        {/* Bottom Row: Auto-scrolling project artwork marquee (strictly hidden when no real images exist) */}
        {marqueeItems.length > 0 && (
          <div className="overflow-hidden pb-2 pt-2">
            <div className="animate-marquee-slow gap-4 sm:gap-5 px-4">
              {marqueeItems.map((item, idx) => (
                <Link
                  key={`${item.id}-${idx}`}
                  to="/work"
                  className="group relative block h-56 w-72 sm:h-72 sm:w-96 shrink-0 overflow-hidden rounded-t-2xl bg-neutral-100"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
