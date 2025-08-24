export const fadeInUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.22,1,0.36,1] } }
});

export const stagger = { 
  show: { 
    transition: { 
      staggerChildren: 0.08 
    } 
  } 
};

export const scaleIn = (delay = 0) => ({
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, delay } }
});

export const shimmer = {
  hidden: {},
  show: {}
};



