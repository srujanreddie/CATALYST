import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { reviews, siteConfig } from '../data/content';
import { Link, useRouter } from '../lib/router';
import { Monogram } from './Monogram';
import { Magnetic, ScrollProgressLine } from './MotionPrimitives';

export function Navbar() {
  const { pathname } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasReviews = reviews.length > 0;

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Work', to: '/work' },
    ...(hasReviews ? [{ label: 'Reviews', to: '/reviews' }] : []),
    { label: 'Contact Us', to: '/contact' },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#070709]/80 backdrop-blur-md border-b border-white/[0.08]">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-5 sm:px-8 lg:px-12">
        {/* Zone 1 (Left): Primary Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 flex-1"
        >
          {navLinks.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative py-5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm ${
                  isActive
                    ? 'text-white'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-indicator"
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-white"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu trigger (Left on mobile) */}
        <div className="flex md:hidden flex-1">
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Zone 2 (Center): Minimalist Geometric Monogram Logo */}
        <div className="flex shrink-0 items-center justify-center">
          <Magnetic strength={0.25} maxOffset={8}>
            <Link
              to="/"
              aria-label={`${siteConfig.name} Home`}
              className="group inline-flex items-center justify-center py-1 px-2 text-white transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm"
            >
              <Monogram className="h-7 w-auto" />
            </Link>
          </Magnetic>
        </div>

        {/* Zone 3 (Right): Primary Action CTA */}
        <div className="flex flex-1 items-center justify-end shrink-0">
          <Magnetic strength={0.26} maxOffset={10}>
            <Link
              to="/contact"
              className="group inline-flex items-center gap-1.5 py-2 px-1 text-sm font-medium text-white whitespace-nowrap shrink-0 transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm"
            >
              <span>Start a Project</span>
              <ArrowUpRight
                className="h-4 w-4 text-neutral-400 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                aria-hidden="true"
              />
            </Link>
          </Magnetic>
        </div>
      </div>

      {/* Scroll-linked white progress hairline */}
      <ScrollProgressLine />

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Mobile Navigation"
            className="md:hidden border-t border-white/[0.08] bg-[#070709]/95 backdrop-blur-xl px-5 py-4"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => {
                const isActive = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-white/[0.06] text-white'
                        : 'text-[#888888] hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="text-xs font-mono text-neutral-400">
                        Active
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
