import React, { useMemo, useState } from 'react';
import { FeaturedProjectSpotlight, ProjectCard } from '../components/ProjectCard';
import { StartProjectBanner } from '../components/StartProjectBanner';
import { projects, siteConfig, type Project } from '../data/content';

interface WorkPageProps {
  onSelectProject: (project: Project) => void;
}

function getWorkGridClass(count: number): string {
  if (count === 2) return 'sm:grid-cols-2';
  if (count === 3) return 'sm:grid-cols-2 lg:grid-cols-3';
  return 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
}

export function WorkPage({ onSelectProject }: WorkPageProps) {
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    projects.forEach((p) => p.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, []);

  const filteredProjects = useMemo(() => {
    if (selectedTag === 'All') return projects;
    return projects.filter((p) => p.tags.includes(selectedTag));
  }, [selectedTag]);

  const showFilters = projects.length > 1 && availableTags.length > 1;

  return (
    <div>
      <section className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500">
              Selected Works
            </p>
            <h1 className="mt-4 text-[clamp(2.25rem,5vw,4.25rem)] font-medium tracking-[-0.035em] leading-[1.06] text-white">
              {siteConfig.workHeadline}
            </h1>
          </div>

          {showFilters && (
            <div
              role="tablist"
              aria-label="Filter projects by discipline"
              className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#111114] border border-white/[0.08] p-1"
            >
              {['All', ...availableTags].map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedTag(tag)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                      isSelected
                        ? 'bg-white text-[#070709]'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Selected Works with zero empty placeholder cards */}
        {filteredProjects.length === 1 && (
          <div className="mt-12">
            <FeaturedProjectSpotlight
              project={filteredProjects[0]}
              onSelect={onSelectProject}
            />
          </div>
        )}

        {filteredProjects.length > 1 && (
          <div className={`mt-12 grid grid-cols-1 gap-5 ${getWorkGridClass(filteredProjects.length)}`}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={onSelectProject}
                aspectClass={
                  filteredProjects.length === 2
                    ? 'aspect-[4/5] sm:aspect-[16/11]'
                    : 'aspect-[4/5]'
                }
              />
            ))}
          </div>
        )}
      </section>

      <StartProjectBanner />
    </div>
  );
}
