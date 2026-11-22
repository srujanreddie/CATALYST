import React from 'react';
import { reviews, siteConfig } from '../data/content';
import { getSafeExternalHref, Link } from '../lib/router';
import { Monogram } from './Monogram';

export function Footer() {
  const hasReviews = reviews.length > 0;
  const activeSocials = siteConfig.socials
    .map((social) => ({
      ...social,
      safeHref: getSafeExternalHref(social.url),
    }))
    .filter((social): social is { label: string; url: string; safeHref: string } =>
      Boolean(social.safeHref)
    );

  return (
    <footer className="w-full bg-[#070709] border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-16 pb-12 sm:pt-20 sm:pb-14">
        <div className="flex flex-col justify-between gap-14 lg:flex-row lg:items-end">
          {/* Left: Oversized stacked brand typography (first letter pure white, remainder muted gray) */}
          <div className="select-none">
            <Link
              to="/"
              aria-label={siteConfig.name}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm"
            >
              <div className="flex flex-col leading-[0.94] tracking-[-0.04em] font-semibold text-[clamp(3.25rem,8vw,6.25rem)]">
                {siteConfig.footerBrandLines.map((line) => {
                  const firstChar = line.slice(0, 1);
                  const restChars = line.slice(1);
                  return (
                    <span key={line} className="block">
                      <span className="text-white">{firstChar}</span>
                      <span className="text-[#3A3A40]">{restChars}</span>
                    </span>
                  );
                })}
              </div>
            </Link>
          </div>

          {/* Right: Two clean link columns + compact bottom-right monogram */}
          <div className="flex flex-col justify-between gap-12 lg:min-w-[340px]">
            <div className="grid grid-cols-2 gap-12 sm:gap-16">
              {/* Column 1: Explore */}
              <div>
                <h2 className="text-xs font-medium tracking-[0.16em] uppercase text-[#66666E] mb-5">
                  Explore
                </h2>
                <ul className="space-y-3.5 text-sm font-medium">
                  <li>
                    <Link
                      to="/"
                      className="text-neutral-200 hover:text-white transition-colors duration-150"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/work"
                      className="text-neutral-200 hover:text-white transition-colors duration-150"
                    >
                      Work
                    </Link>
                  </li>
                  {hasReviews && (
                    <li>
                      <Link
                        to="/reviews"
                        className="text-neutral-200 hover:text-white transition-colors duration-150"
                      >
                        Reviews
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      to="/contact"
                      className="text-neutral-200 hover:text-white transition-colors duration-150"
                    >
                      Start a Project
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin"
                      className="text-[#66666E] hover:text-neutral-300 transition-colors duration-150"
                    >
                      Admin Inbox
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Connect */}
              <div>
                <h2 className="text-xs font-medium tracking-[0.16em] uppercase text-[#66666E] mb-5">
                  Connect
                </h2>
                <ul className="space-y-3.5 text-sm font-medium">
                  <li>
                    <a
                      href={`mailto:${siteConfig.contactEmail}`}
                      className="text-neutral-200 hover:text-white transition-colors duration-150 break-all"
                    >
                      Email
                    </a>
                  </li>
                  {activeSocials.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-200 hover:text-white transition-colors duration-150"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom-right monogram & quiet copyright */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] lg:border-none lg:pt-0 lg:justify-end lg:gap-6">
              <span className="text-xs text-[#66666E]">
                © {new Date().getFullYear()} {siteConfig.name}
              </span>
              <Link
                to="/"
                aria-label={`${siteConfig.name} Monogram`}
                className="text-white/90 hover:text-white transition-colors"
              >
                <Monogram className="h-5 w-auto" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
