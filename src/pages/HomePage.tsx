import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ClientLogoMarquee,
  ManifestoAndPillarsSection,
  MetricsAndLogoWall,
  SolutionsSection,
  TestimonialsPreviewSection,
} from '../components/EditorialSections';
import { FeaturedProjectSpotlight, ProjectCard } from '../components/ProjectCard';
import { StartProjectBanner } from '../components/StartProjectBanner';
import { projects, siteConfig, type Project } from '../data/content';

interface HomePageProps {
  onSelectProject: (project: Project) => void;
}

function getResponsiveGridClass(count: number): string {
  if (count === 2) return 'lg:grid-cols-2';
  if (count === 3) return 'lg:grid-cols-3';
  if (count === 4) return 'lg:grid-cols-4';
  return 'lg:grid-cols-5';
}

export function HomePage({ onSelectProject }: HomePageProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const rotatingWords = siteConfig.heroRotatingWords;

  useEffect(() => {
    if (rotatingWords.length <= 1) return;
    const interval = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [rotatingWords.length]);

  const currentWord = rotatingWords[wordIndex] ?? '';
  const featuredProjects = projects.slice(0, 5);

  return (
    <div>
      {/* Hero Section */}
      <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="max-w-5xl">
          <h1 className="text-[clamp(2.25rem,5.2vw,4.5rem)] font-medium tracking-[-0.035em] leading-[1.08] text-white">
            <span>{siteConfig.heroPrefix} </span>
            <span className="inline-grid align-baseline">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={currentWord}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12, filter: 'blur(8px)' }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, filter: 'blur(0px)' }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -12, filter: 'blur(8px)' }
                  }
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="col-start-1 row-start-1 inline-block text-white"
                >
                  {currentWord}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </div>

        {/* Featured Work Showcase: Zero empty slots; adapts cleanly to project count */}
        {featuredProjects.length === 1 && (
          <div className="mt-10 sm:mt-14">
            <FeaturedProjectSpotlight
              project={featuredProjects[0]}
              onSelect={onSelectProject}
            />
          </div>
        )}

        {featuredProjects.length > 1 && (
          <div className="mt-10 sm:mt-14">
            <div
              className={`flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory no-scrollbar lg:grid ${getResponsiveGridClass(
                featuredProjects.length
              )} lg:gap-4 lg:overflow-visible lg:pb-0`}
            >
              {featuredProjects.map((project) => (
                <div
                  key={project.id}
                  className="w-[78vw] sm:w-[44vw] md:w-[32vw] lg:w-auto shrink-0 snap-start"
                >
                  <ProjectCard
                    project={project}
                    onSelect={onSelectProject}
                    aspectClass={
                      featuredProjects.length === 2
                        ? 'aspect-[4/5] sm:aspect-[16/11]'
                        : 'aspect-[4/5]'
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Conditional Client Logo Marquee */}
      <ClientLogoMarquee />

      {/* Solutions / Services Section */}
      <SolutionsSection />

      {/* Studio Manifesto & Scroll-Focused Vision / Intention / Obsession */}
      <ManifestoAndPillarsSection />

      {/* Conditional Metrics & Partner Logo Wall */}
      <MetricsAndLogoWall />

      {/* Conditional Testimonials Preview */}
      <TestimonialsPreviewSection />

      {/* Signature White "Start a Project" CTA Banner */}
      <StartProjectBanner />
    </div>
  );
}
