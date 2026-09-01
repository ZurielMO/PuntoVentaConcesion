/**
 * Centralized Motion Design System for Arena VIP
 * Follows 60fps transform & opacity guidelines, reduced motion support.
 */

import { type Transition, type Variants } from "motion/react";

// Timing & Duration standards
export const VIP_MOTION = {
  durations: {
    micro: 0.15,
    fast: 0.25,
    normal: 0.35,
    slow: 0.5,
    pulse: 2.0,
  },
  easings: {
    easeOut: [0.16, 1, 0.3, 1], // Smooth deceleration
    easeInOut: [0.4, 0, 0.2, 1],
    springBouncy: { type: "spring", stiffness: 400, damping: 25 },
    springGentle: { type: "spring", stiffness: 280, damping: 24 },
    springSnappy: { type: "spring", stiffness: 500, damping: 30 },
  },
  press: {
    scale: 0.96,
    duration: 0.12,
  },
  modal: {
    backdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.2 } },
      exit: { opacity: 0, transition: { duration: 0.2 } },
    } as Variants,
    sheet: {
      initial: { opacity: 0, y: "100%" },
      animate: {
        opacity: 1,
        y: "0%",
        transition: {
          type: "spring",
          damping: 28,
          stiffness: 300,
        },
      },
      exit: {
        opacity: 0,
        y: "100%",
        transition: {
          duration: 0.2,
          ease: "easeInOut",
        },
      },
    } as Variants,
  },
} as const;

// Preset transitions
export const transitionFast: Transition = {
  duration: VIP_MOTION.durations.fast,
  ease: [0.16, 1, 0.3, 1],
};

export const transitionNormal: Transition = {
  duration: VIP_MOTION.durations.normal,
  ease: [0.16, 1, 0.3, 1],
};

export const transitionSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

// Page and Container Variants
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: VIP_MOTION.durations.normal,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: VIP_MOTION.durations.fast,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Staggered list container
export const staggerContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Staggered list item
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: VIP_MOTION.durations.normal,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// Card / Button Tap Press Microinteractions
export const pressInteraction = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.12 },
};

export const buttonPressInteraction = {
  whileTap: { scale: 0.96 },
  transition: { duration: 0.1 },
};

// Bottom Sheet / Modal Drawer Variants
export const bottomSheetVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: "0%",
    transition: {
      type: "spring",
      damping: 28,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Badge Pop Animation
export const badgePopVariants: Variants = {
  initial: { scale: 0.6, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
  exit: { scale: 0.6, opacity: 0, transition: { duration: 0.15 } },
};
