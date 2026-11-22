import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'motion/react';

function useIsFinePointer(): boolean {
  const [isFine, setIsFine] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: fine)');
    const update = () => setIsFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isFine;
}

/**
 * Global fine-pointer monochrome ambient spotlight + spring-tracked magnetic cursor ring.
 * Uses MotionValues exclusively to avoid React re-renders on pointer movement.
 */
export function CursorGlow() {
  const isFinePointer = useIsFinePointer();
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(-1000);
  const pointerY = useMotionValue(-1000);

  // Soft trailing ambient glow
  const glowX = useSpring(pointerX, { stiffness: 150, damping: 28, mass: 0.6 });
  const glowY = useSpring(pointerY, { stiffness: 150, damping: 28, mass: 0.6 });

  // Crisp responsive precision halo
  const ringX = useSpring(pointerX, { stiffness: 460, damping: 34, mass: 0.35 });
  const ringY = useSpring(pointerY, { stiffness: 460, damping: 34, mass: 0.35 });

  const [visible, setVisible] = useState(false);
  const [cursorMode, setCursorMode] = useState<'default' | 'interactive' | 'view'>('default');
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (!isFinePointer || prefersReducedMotion) return;

    const handlePointerMove = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      setVisible(true);

      const target = event.target as HTMLElement | null;
      if (!target) {
        setCursorMode('default');
        return;
      }

      if (target.closest('[data-cursor="view"]')) {
        setCursorMode('view');
      } else if (
        target.closest('a, button, [role="button"], input, textarea, select, [data-cursor="interactive"]')
      ) {
        setCursorMode('interactive');
      } else {
        setCursorMode('default');
      }
    };

    const handlePointerLeave = () => setVisible(false);
    const handlePointerDown = () => setIsPressed(true);
    const handlePointerUp = () => setIsPressed(false);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isFinePointer, prefersReducedMotion, pointerX, pointerY]);

  if (!isFinePointer || prefersReducedMotion) {
    return null;
  }

  const ringSize = cursorMode === 'view' ? 76 : cursorMode === 'interactive' ? 42 : 26;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {/* Ambient Monochrome Radial Spotlight */}
      <motion.div
        style={{
          x: glowX,
          y: glowY,
          translateX: '-50%',
          translateY: '-50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 35%, rgba(255,255,255,0) 70%)',
        }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="fixed top-0 left-0 h-[540px] w-[540px] rounded-full will-change-transform"
      />

      {/* Precision Magnetic Cursor Halo */}
      <motion.div
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: visible ? 1 : 0,
          width: ringSize,
          height: ringSize,
          scale: isPressed ? 0.88 : 1,
          backgroundColor:
            cursorMode === 'view'
              ? 'rgba(255, 255, 255, 0.94)'
              : cursorMode === 'interactive'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0)',
          borderColor:
            cursorMode === 'view'
              ? 'rgba(255, 255, 255, 1)'
              : cursorMode === 'interactive'
                ? 'rgba(255, 255, 255, 0.45)'
                : 'rgba(255, 255, 255, 0.22)',
        }}
        transition={{
          opacity: { duration: 0.18 },
          width: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
          height: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 0.12 },
          backgroundColor: { duration: 0.18 },
          borderColor: { duration: 0.18 },
        }}
        className="fixed top-0 left-0 flex items-center justify-center rounded-full border will-change-transform"
      >
        {cursorMode === 'view' && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.14 }}
            className="text-[11px] font-semibold tracking-tight text-[#070709] select-none"
          >
            View ↗
          </motion.span>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Razor-thin 2px scroll-linked progress hairline for the sticky Navbar bottom edge.
 */
export function ScrollProgressLine() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-gradient-to-r from-white/40 via-white to-white/90"
    />
  );
}

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  maxOffset?: number;
}

/**
 * Tactile spring-driven magnetic hover wrapper for signature studio CTAs and icons.
 */
export function Magnetic({
  children,
  className = 'inline-flex',
  strength = 0.28,
  maxOffset = 12,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isFinePointer = useIsFinePointer();
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 340, damping: 24, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 340, damping: 24, mass: 0.4 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isFinePointer || prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (event.clientY - (rect.top + rect.height / 2)) * strength;
    rawX.set(Math.max(-maxOffset, Math.min(maxOffset, dx)));
    rawY.set(Math.max(-maxOffset, Math.min(maxOffset, dy)));
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareOpacity?: number;
}

/**
 * 3D perspective card tilt with pointer-tracked monochrome specular glare and border sheen.
 */
export function TiltCard3D({
  children,
  className = '',
  maxTilt = 7,
  glareOpacity = 0.14,
}: TiltCard3DProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isFinePointer = useIsFinePointer();
  const prefersReducedMotion = useReducedMotion();

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const sheenOpacityRaw = useMotionValue(0);

  const rotateX = useSpring(rotateXRaw, { stiffness: 260, damping: 26, mass: 0.6 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 260, damping: 26, mass: 0.6 });
  const sheenOpacity = useSpring(sheenOpacityRaw, { stiffness: 220, damping: 28 });

  const glareBackground = useMotionTemplate`radial-gradient(460px circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, ${glareOpacity}), rgba(255, 255, 255, 0) 70%)`;
  const borderGlowBackground = useMotionTemplate`radial-gradient(360px circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 68%)`;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isFinePointer || prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    const clampedX = Math.max(0, Math.min(1, px));
    const clampedY = Math.max(0, Math.min(1, py));

    // Tilt smoothly toward cursor
    rotateYRaw.set((clampedX - 0.5) * 2 * maxTilt);
    rotateXRaw.set((0.5 - clampedY) * 2 * maxTilt);
    glareX.set(clampedX * 100);
    glareY.set(clampedY * 100);
    sheenOpacityRaw.set(1);
  };

  const handlePointerLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    sheenOpacityRaw.set(0);
  };

  return (
    <div style={{ perspective: 1100 }} className="w-full">
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: isFinePointer && !prefersReducedMotion ? rotateX : 0,
          rotateY: isFinePointer && !prefersReducedMotion ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        whileHover={isFinePointer && !prefersReducedMotion ? { scale: 1.012 } : undefined}
        transition={{ scale: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
        className={`relative rounded-2xl will-change-transform ${className}`}
      >
        {/* Subtle illuminated border highlight following pointer */}
        <motion.div
          aria-hidden="true"
          style={{
            background: borderGlowBackground,
            opacity: sheenOpacity,
          }}
          className="pointer-events-none absolute -inset-[1px] rounded-2xl z-0"
        />

        {/* Card content */}
        <div className="relative z-10 h-full w-full rounded-2xl overflow-hidden">
          {children}

          {/* Monochrome specular glare overlay */}
          <motion.div
            aria-hidden="true"
            style={{
              background: glareBackground,
              opacity: sheenOpacity,
            }}
            className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
          />
        </div>
      </motion.div>
    </div>
  );
}

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}

/**
 * Compositor-safe viewport reveal with subtle upward lift and blur-to-sharp settle.
 */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  yOffset = 22,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: yOffset, filter: 'blur(6px)' }
      }
      whileInView={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: 'blur(0px)' }
      }
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
