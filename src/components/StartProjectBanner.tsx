import React, { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { projects } from '../data/content';
import { Link } from '../lib/router';
import { Magnetic } from './MotionPrimitives';

export function StartProjectBanner() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'center center'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.96, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [28, 0]);

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
      ref={containerRef}
      aria-label="Start a Project"
      className="w-full px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20"
    >
      <motion.div
        style={prefersReducedMotion ? undefined : { scale, y }}
        className="mx-auto max-w-[1440px] overflow-hidden rounded-3xl bg-white text-[#070709] will-change-transform"
      >
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
            <h2 className="text-[clamp(2.5rem,7.2vw,6.25rem)] font-medium tracking-[-0.04em] leading-[0.98] text-[#070709] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5">
              Start a Project
            </h2>
          </div>

          <Magnetic strength={0.38} maxOffset={16} className="mt-1 sm:mt-2 shrink-0">
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center p-2 text-[#888888] transition-all duration-200 ease-out group-hover:translate-x-1.5 group-hover:-translate-y-1.5 group-hover:text-[#070709]"
            >
              <ArrowUpRight className="h-9 w-9 sm:h-12 sm:w-12 lg:h-14 lg:w-14 stroke-[1.75]" />
            </span>
          </Magnetic>
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
      </motion.div>
    </section>
  );
}
