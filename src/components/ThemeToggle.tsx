import { motion, useReducedMotion } from 'framer-motion';
import type { ThemeMode } from '../theme/ThemeProvider';

type ThemeToggleProps = {
  value: ThemeMode;
  onChange: (next: ThemeMode) => void;
};

const ThemeToggle = ({ value, onChange }: ThemeToggleProps) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      onClick={() => onChange(value === 'dark' ? 'light' : 'dark')}
      className="flex h-10 flex-none items-center gap-2 whitespace-nowrap rounded-full border border-grid bg-panel px-4 text-[11px] uppercase tracking-[0.3em] text-muted transition hover:text-text"
    >
      <span className="text-accent">{value === 'dark' ? 'Dark' : 'Light'}</span>
      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-[#0b0f14]">
        Toggle
      </span>
    </motion.button>
  );
};

export default ThemeToggle;
