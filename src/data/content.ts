/**
 * CATALYS — Centralized Studio Content Configuration
 * ---------------------------------------------------------------------------
 * STRICT ZERO-FAKE-DATA ARCHITECTURE:
 * Add your real projects, metrics, client logos, reviews, and social URLs
 * below. Every section across the site automatically updates—or stays cleanly
 * hidden—based on the real arrays exported from this file.
 */

export interface SocialLink {
  label: string;
  /** Add your full profile URL (e.g., "https://x.com/yourhandle") to activate this link in the UI. */
  url?: string;
}

export interface EditorialPillar {
  id: string;
  title: string;
  description: string;
}

export interface SiteConfig {
  name: string;
  monogram: string;
  /** Stacked brand lines rendered in the monumental footer (first character pure white, remainder muted gray). */
  footerBrandLines: string[];
  heroPrefix: string;
  heroRotatingWords: string[];
  manifestoEyebrow: string;
  manifestoLead: string;
  manifestoBody: string;
  pillarsEyebrow: string;
  pillars: EditorialPillar[];
  contactEmail: string;
  contactHeadline: string;
  contactSubcopy: string;
  workHeadline: string;
  reviewsHeadline: string;
  socials: SocialLink[];
}

export interface ServiceCategory {
  id: string;
  title: string;
  deliverables: string[];
}

export interface Project {
  id: string;
  title: string;
  /** Optional concise subtitle shown beneath the project title in spotlight/modal views. */
  subtitle?: string;
  /** Optional short status/achievement label shown top-left (e.g., "Live Web App"). */
  badge?: string;
  /** Unboxed service tags shown cleanly beneath the project title. */
  tags: string[];
  /** Optional static cover image path in `/public/images/...`. When omitted and `liveUrl` is set, a live site preview renders automatically. */
  image?: string;
  shortDescription: string;
  /** Optional extended fields displayed inside the Project Detail modal. */
  client?: string;
  year?: string;
  deliverables?: string[];
  outcome?: string;
  liveUrl?: string;
}

export interface Metric {
  id: string;
  /** Numeric target for scroll count-up animation (e.g., 12). */
  value: number;
  /** Optional prefix (e.g., "$"). */
  prefix?: string;
  /** Optional suffix (e.g., "+", "%", "x"). */
  suffix?: string;
  /** Explicit label with context (e.g., "Production Launches Shipped"). */
  label: string;
  /** Optional timeframe or qualifier. */
  context?: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  /** Optional path to a monochrome SVG/PNG logo in `/public/images/logos/...`. */
  logoSrc?: string;
}

export interface Review {
  id: string;
  author: string;
  role: string;
  company: string;
  quote: string;
  /** Optional portrait path in `/public/images/avatars/...`. */
  avatarSrc?: string;
  /** Optional monochrome client logo path. */
  companyLogoSrc?: string;
}

export const siteConfig: SiteConfig = {
  name: 'CATALYS',
  monogram: 'CTY',
  footerBrandLines: ['Catalys', 'Design', 'Studio.'],
  heroPrefix: 'The design partner for',
  heroRotatingWords: ['founders.', 'startups.', 'disruptors.'],
  manifestoEyebrow: 'THE STUDIO',
  manifestoLead:
    'CATALYS is a design and engineering practice defined by vision, intention, and obsession—built for teams that refuse to blend in.',
  manifestoBody:
    'We bridge full-stack web engineering with kinetic motion and creative direction so every interaction, product surface, and launch moment feels deliberate and unmistakable.',
  pillarsEyebrow: 'WHY CATALYS',
  pillars: [
    {
      id: 'vision',
      title: 'Vision',
      description:
        'Our instinct is clarity. We distill complex product ideas into sharp visual and technical architecture—turning early conviction into digital experiences built to endure.',
    },
    {
      id: 'intention',
      title: 'Intention',
      description:
        'Nothing ships by accident. From type rhythm and motion timing to backend structure and performance budgets, every decision serves a measurable purpose.',
    },
    {
      id: 'obsession',
      title: 'Obsession',
      description:
        'Craft lives in the details most teams overlook. We refine interactions, transitions, and code quality until the final product speaks for itself.',
    },
  ],
  contactEmail: 'gokasrujanreddy@gmail.com',
  contactHeadline: "Let's Kickstart Your Vision",
  contactSubcopy:
    'The first conversation is where clarity begins. Share what you are building and we will follow up directly.',
  workHeadline: 'Selected works.',
  reviewsHeadline: 'Client perspectives.',
  socials: [
    // Fill in your real profile URLs below to display them in the Footer:
    { label: 'X (Twitter)', url: '' },
    { label: 'GitHub', url: '' },
    { label: 'Instagram', url: '' },
  ],
};

export const services: ServiceCategory[] = [
  {
    id: 'web-development',
    title: 'Web Development',
    deliverables: [
      'Full-Stack Engineering',
      'Interactive Web Applications',
      'Design Systems & UI Architecture',
      'Frontend Performance Optimization',
      'API & Backend Development',
      'Responsive Marketing Sites',
      'Technical Prototyping',
      'CMS & Custom Integrations',
    ],
  },
  {
    id: 'motion-direction',
    title: 'Motion & Direction',
    deliverables: [
      'Motion Design Systems',
      'Creative Direction',
      'Kinetic Typography',
      'Interaction Prototyping',
      'Product Launch Visuals',
      'Art Direction',
      'Micro-Interaction Choreography',
      'Brand Film & Reel Direction',
    ],
  },
];

/**
 * REAL PROJECTS
 * ---------------------------------------------------------------------------
 * Add additional real projects here anytime—the Home and /work grids scale
 * automatically without empty placeholder slots.
 */
export const projects: Project[] = [
  {
    id: 'krishiveyra',
    title: 'KRISHIVEYRA',
    subtitle: 'Crop Doctor & Farmer Digital Assistant',
    badge: 'Live Web App',
    tags: ['Web Development', 'Product Design', 'Mobile-First'],
    shortDescription:
      'Mobile-friendly digital assistant for farmers to scan sick crops, get exact medicine recipes and spray schedules, receive weather spray alarms, chat with agronomists, and record farm logs.',
    deliverables: [
      'Mobile-First Web App',
      'Crop Diagnostics Flow',
      'Spray Schedules & Weather Alarms',
      'Agronomist Chat & Farm Logs',
    ],
    liveUrl: 'https://krishiveyra.ai.studio',
  },
  {
    id: 'cse-sem-1-vault',
    title: 'CSE Sem 1 Noticeboard & Vault',
    subtitle: 'Academic Cohort Hub & Resource Directory',
    badge: 'Live Web App',
    tags: ['Web Development', 'UI/UX Design', 'Resource Hub'],
    shortDescription:
      'Semester 1 Computer Science and Engineering cohort noticeboard, immediate threats countdown, subject vault, and resource directory.',
    deliverables: [
      'Cohort Noticeboard',
      'Deadline Countdown Tracker',
      'Subject Vault & Resource Directory',
      'Responsive Web Application',
    ],
    liveUrl: 'https://bash-b.vercel.app/',
  },
];

/**
 * REAL METRICS (Optional — section stays hidden while empty)
 */
export const metrics: Metric[] = [];

/**
 * REAL CLIENT LOGOS (Optional — marquee & wall stay hidden while empty)
 */
export const clientLogos: ClientLogo[] = [];

/**
 * REAL CLIENT REVIEWS (Optional — nav link & sections stay hidden while empty)
 */
export const reviews: Review[] = [];
