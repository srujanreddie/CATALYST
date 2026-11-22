import React, { useState } from 'react';
import { ArrowUpRight, Globe } from 'lucide-react';
import type { Project } from '../data/content';
import { getSafeExternalHref } from '../lib/router';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  aspectClass?: string;
}

function getHostname(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Portfolio card used when 2+ projects are showcased in a multi-column grid.
 */
export function ProjectCard({
  project,
  onSelect,
  aspectClass = 'aspect-[4/5]',
}: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const safeLiveUrl = getSafeExternalHref(project.liveUrl);
  const showImage = Boolean(project.image) && !imageError;

  const visibleTags = project.tags.slice(0, 3);
  const remainingCount = Math.max(0, project.tags.length - 3);

  return (
    <button
      type="button"
      onClick={() => onSelect(project)}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl bg-[#111114] border border-white/[0.08] ${aspectClass} text-left transition-colors duration-200 hover:border-white/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
    >
      <div className="relative h-full w-full overflow-hidden">
        {showImage ? (
          <img
            src={project.image}
            alt={project.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        ) : safeLiveUrl ? (
          <div className="relative h-full w-full overflow-hidden bg-[#0b0b0e]">
            <iframe
              src={safeLiveUrl}
              title={`${project.title} live preview`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className="pointer-events-none h-[200%] w-[200%] origin-top-left scale-50 border-0 bg-[#0b0b0e]"
              tabIndex={-1}
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#111114] p-8 text-center">
            <span className="text-2xl font-semibold tracking-tight text-white/90">
              {project.title}
            </span>
          </div>
        )}

        {/* Measured bottom contrast scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070709]/95 via-[#070709]/45 to-transparent"
        />

        {/* Optional top-left glassmorphic badge */}
        {project.badge && (
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start">
            <span className="inline-flex max-w-full truncate items-center rounded-lg bg-[#070709]/75 backdrop-blur-md border border-white/[0.14] px-2.5 py-1 text-xs font-medium text-white">
              {project.badge}
            </span>
          </div>
        )}

        {/* Bottom title & unboxed service tags */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-xl font-medium tracking-tight text-white leading-snug truncate">
            {project.title}
          </h3>
          {visibleTags.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300/85">
              {visibleTags.map((tag) => (
                <span key={tag} className="whitespace-nowrap">
                  {tag}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="font-mono text-[11px] text-neutral-400">
                  +{remainingCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Full-width editorial spotlight card used cleanly when showcasing a single real project,
 * eliminating empty trailing grid slots while presenting a live interactive site preview.
 */
export function FeaturedProjectSpotlight({ project, onSelect }: ProjectCardProps) {
  const [imageError, setImageError] = useState(false);
  const safeLiveUrl = getSafeExternalHref(project.liveUrl);
  const showImage = Boolean(project.image) && !imageError;
  const hostname = getHostname(safeLiveUrl ?? undefined);

  return (
    <article className="group overflow-hidden rounded-2xl bg-[#111114] border border-white/[0.08] transition-colors duration-200 hover:border-white/[0.16]">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Visual Preview Frame */}
        <div className="relative lg:col-span-7 min-h-[340px] sm:min-h-[440px] lg:min-h-[520px] bg-[#0b0b0e] border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-hidden flex flex-col">
          {/* Minimal browser chrome header for live preview */}
          {safeLiveUrl && !showImage && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0c0c10] border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono truncate">
                <Globe className="h-3.5 w-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
                <span className="truncate">{hostname}</span>
              </div>
              {project.badge && (
                <span className="text-[11px] font-medium text-neutral-300 whitespace-nowrap shrink-0">
                  {project.badge}
                </span>
              )}
            </div>
          )}

          <div
            onClick={() => onSelect(project)}
            role="button"
            tabIndex={0}
            aria-label={`Open ${project.title} project details`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(project);
              }
            }}
            className="relative flex-1 w-full cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60"
          >
            {showImage ? (
              <img
                src={project.image}
                alt={project.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            ) : safeLiveUrl ? (
              <iframe
                src={safeLiveUrl}
                title={`${project.title} live site preview`}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                className="pointer-events-none absolute inset-0 h-[155%] w-[155%] origin-top-left scale-[0.645] border-0 bg-[#0b0b0e]"
                tabIndex={-1}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-10">
                <span className="text-3xl font-semibold tracking-tight text-white">
                  {project.title}
                </span>
              </div>
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#070709]/80 to-transparent"
            />
          </div>
        </div>

        {/* Right Editorial Details Column */}
        <div className="lg:col-span-5 flex flex-col justify-between p-7 sm:p-10 lg:p-12">
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-400">
              {project.tags.map((tag, idx) => (
                <React.Fragment key={tag}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span className="whitespace-nowrap">{tag}</span>
                </React.Fragment>
              ))}
            </div>

            <h2 className="mt-5 text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-white">
              {project.title}
            </h2>

            {project.subtitle && (
              <p className="mt-2 text-base font-medium text-neutral-300">
                {project.subtitle}
              </p>
            )}

            <p className="mt-5 text-sm sm:text-[15px] leading-relaxed text-[#888888]">
              {project.shortDescription}
            </p>

            {project.deliverables && project.deliverables.length > 0 && (
              <div className="mt-7 pt-6 border-t border-white/[0.08]">
                <p className="text-xs font-medium tracking-[0.16em] uppercase text-neutral-500 mb-3">
                  Key Capabilities
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-neutral-300">
                  {project.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-4">
            {safeLiveUrl && (
              <a
                href={safeLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#070709] hover:bg-neutral-200 transition-colors duration-150 whitespace-nowrap"
              >
                <span>Visit Live Site</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => onSelect(project)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] px-4 py-2.5 text-sm font-medium text-white hover:border-white/30 transition-colors duration-150 whitespace-nowrap"
            >
              <span>Inspect Details</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
