import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { CursorGlow } from './components/MotionPrimitives';
import { Navbar } from './components/Navbar';
import { ProjectModal } from './components/ProjectModal';
import type { Project } from './data/content';
import { FirebaseProvider } from './lib/FirebaseProvider';
import { RouterProvider, useRouter } from './lib/router';
import { AdminPage } from './pages/AdminPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { ReviewsPage } from './pages/ReviewsPage';
import { WorkPage } from './pages/WorkPage';

function AppShell() {
  const { pathname } = useRouter();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const renderPage = () => {
    switch (pathname) {
      case '/work':
        return <WorkPage onSelectProject={setSelectedProject} />;
      case '/reviews':
        return <ReviewsPage />;
      case '/contact':
        return <ContactPage />;
      case '/admin':
        return <AdminPage />;
      case '/':
      default:
        return <HomePage onSelectProject={setSelectedProject} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070709] text-white">
      <CursorGlow />
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <RouterProvider>
          <AppShell />
        </RouterProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
