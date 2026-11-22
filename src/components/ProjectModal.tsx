import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Globe, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Project } from '../data/content';
import { getSafeExternalHref, Link } from '../lib/router';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

function getHostname(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [project, onClose]);

  const safeLiveUrl = getSafeExternalHref(project?.liveUrl);
  const showImage = Boolean(project?.image) && !imageError;

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 lg:p-10"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#111114] border border-white/[0.1]"
          >
            {/* Top-right high-contrast close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close project details"
              className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#070709]/85 text-white border border-white/[0.14] hover:bg-white hover:text-[#070709] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Media or live interactive preview */}
            {showImage ? (
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900 border-b border-white/[0.08]">
                <img
                  src={project.image}
                  alt={project.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : safeLiveUrl ? (
              <div className="w-full border-b border-white/[0.08] bg-[#0b0b0e]">
                <div className="flex items-center gap-2 px-5 py-3.5 pr-16 border-b border-white/[0.08] text-xs font-mono text-neutral-400">
                  <Globe className="h-3.5 w-3.5 text-neutral-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{getHostname(safeLiveUrl)}</span>
                </div>
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <iframe
                    src={safeLiveUrl}
                    title={`${project.title} interactive preview`}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    className="h-full w-full border-0 bg-[#0b0b0e]"
                  />
                </div>
              </div>
            ) : null}

            {/* Case study details */}
            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#888888]">
                {project.client && <span>{project.client}</span>}
                {project.client && project.year && <span aria-hidden="true">·</span>}
                {project.year && <span className="font-mono tabular-nums">{project.year}</span>}
                {(project.client || project.year) && project.badge && <span aria-hidden="true">·</span>}
                {project.badge && <span className="text-neutral-200">{project.badge}</span>}
              </div>

              <h2
                id="project-modal-title"
                className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white"
              >
                {project.title}
              </h2>

              {project.subtitle && (
                <p className="mt-1.5 text-base font-medium text-neutral-300">
                  {project.subtitle}
                </p>
              )}

              <p className="mt-4 text-base leading-relaxed text-neutral-300 max-w-2xl">
                {project.shortDescription}
              </p>

              {project.outcome && (
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <p className="text-xs tracking-[0.18em] uppercase text-[#888888]">
                    Outcome
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {project.outcome}
                  </p>
                </div>
              )}

              {(project.deliverables?.length || project.tags.length > 0) && (
                <div className="mt-6 pt-6 border-t border-white/[0.08]">
                  <p className="text-xs tracking-[0.18em] uppercase text-[#888888]">
                    Deliverables
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-neutral-200">
                    {(project.deliverables?.length ? project.deliverables : project.tags).map(
                      (item) => (
                        <span key={item}>{item}</span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
                {safeLiveUrl ? (
                  <a
                    href={safeLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#070709] hover:bg-neutral-200 transition-colors duration-150 whitespace-nowrap"
                  >
                    <span>Visit Live Project</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ) : (
                  <div />
                )}

                <Link
                  to="/contact"
                  onClick={onClose}
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-neutral-300 transition-colors whitespace-nowrap"
                >
                  <span>Start a similar project</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
