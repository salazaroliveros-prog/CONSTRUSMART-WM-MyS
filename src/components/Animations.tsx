import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ANIMATION_CONFIG = {
  fast: { duration: 0.2 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 },
};

export const TRANSITIONS = {
  default: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  smooth: {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
  },
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 20,
  },
};

export const viewVariants = {
  enter: {
    opacity: 0,
    x: 20,
    scale: 0.95,
  },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
};

export const listVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  },
};

export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

export const ViewTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={viewVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={TRANSITIONS.smooth}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedList: React.FC<{
  children: React.ReactNode[];
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={listVariants.container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {children.map((child, index) => (
          <motion.div
            key={index}
            variants={listVariants.item}
            layout
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export const AnimatedModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, onClose, children, className = '' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${className}`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};

export const ScrollAnimated: React.FC<{
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}> = ({ children, className = '', threshold = 0.1 }) => {
  const { ref, isVisible } = useScrollAnimation(threshold);

  return (
    <motion.div
      ref={ref as any}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={TRANSITIONS.smooth}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedLoader: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        style={{
          width: size,
          height: size,
          border: '3px solid rgba(59, 130, 246, 0.3)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export const AnimatedIcon: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  pulse?: boolean;
}> = ({ children, className = '', hover = false, pulse = false }) => {
  const variants = {
    idle: { scale: 1 },
    hover: hover ? { scale: 1.2, rotate: 5 } : {},
    pulse: pulse ? {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    } : {},
  };

  return (
    <motion.div
      variants={variants}
      animate={pulse ? 'pulse' : 'idle'}
      whileHover={hover ? 'hover' : ''}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const supportsReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getAnimationConfig = () => {
  if (supportsReducedMotion()) {
    return {
      duration: 0,
      type: false as const,
    };
  }
  return TRANSITIONS.smooth;
};
