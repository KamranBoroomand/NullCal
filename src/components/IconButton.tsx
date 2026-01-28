import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type IconButtonProps = {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

const IconButton = ({ label, onClick, children, className }: IconButtonProps) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      onClick={onClick}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className={`flex items-center justify-center ${className ?? ''}`}
      aria-label={label}
    >
      {children}
    </motion.button>
  );
};

export default IconButton;
