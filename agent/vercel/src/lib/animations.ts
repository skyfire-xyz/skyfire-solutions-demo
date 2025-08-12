import { type Variants } from "motion/react";

// Core animation constants
const SPRING_STIFF = 150;
const SPRING_DAMP = 15;
const SPRING_MASS = 1;

// Custom easing curves for consistent motion
export const EASE_CUSTOM_IN_OUT = [0.32, 0.72, 0, 1];
export const EASE_CUSTOM_OUT = [0, 0, 0.38, 1];

// Enhanced spring configuration with better physics
export const springTransition = {
  type: "spring",
  stiffness: SPRING_STIFF,
  damping: SPRING_DAMP,
  mass: SPRING_MASS,
  restDelta: 0.001,
  restSpeed: 0.001,
} as const;

// Enhanced fade transition
export const fadeIn = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: EASE_CUSTOM_IN_OUT,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: EASE_CUSTOM_OUT,
    },
  },
} satisfies Variants;

// Enhanced slide transitions with spring physics
export const slideInFromRight = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: springTransition,
  },
} as const;

export const slideInFromLeft = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: springTransition,
  },
} as const;

// Enhanced scale transition with spring physics
export const fadeInScale = {
  initial: { opacity: 0, scale: 0.97 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      ...springTransition,
      stiffness: 200, // Slightly stiffer for scale
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: {
      duration: 0.15,
      ease: EASE_CUSTOM_OUT,
    },
  },
} as const;

// Enhanced content transition with layered animations and spring physics
export const contentTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 4,
    scale: 0.9,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      type: "spring",
      bounce: 0.02,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(4px)",
  },
};

// Enhanced child item variants for staggered content
export const contentItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Enhanced interactive animations
export const agentSelectorVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.015,
    transition: {
      duration: 0.15,
      ease: EASE_CUSTOM_OUT,
    },
  },
  tap: {
    scale: 0.985,
    transition: {
      duration: 0.1,
      ease: EASE_CUSTOM_OUT,
    },
  },
};

// Enhanced icon animations
export const iconSpinVariants = {
  initial: { rotate: 0 },
  hover: {
    rotate: 180,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

// Enhanced stagger container animation
export const staggerContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.02,
      type: "spring",
      stiffness: 150,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

// Enhanced stagger item animation
export const staggerItemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...springTransition,
      stiffness: 200,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: EASE_CUSTOM_IN_OUT,
    },
  },
};

// Enhanced loading animation
export const loadingSpinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1.2,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop" as const,
    },
  },
};

// Enhanced pulse animation
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// Enhanced progress bar animation
export const progressBarVariants = {
  initial: { scaleX: 0, originX: 0 },
  animate: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: EASE_CUSTOM_OUT,
    },
  },
  exit: {
    scaleX: 0,
    transition: {
      duration: 0.4,
      ease: EASE_CUSTOM_IN_OUT,
    },
  },
};

// Panel transition variants for input and output panels
export const panelTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1,
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: EASE_CUSTOM_OUT,
    },
  },
};

// Output panel specific variants with different initial direction
export const outputPanelVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1,
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: EASE_CUSTOM_OUT,
    },
  },
};
