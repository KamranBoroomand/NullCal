import type { ReactNode } from 'react';

type IconButtonProps = {
  label: string;
  onClick?: () => void;
  children: ReactNode;
};

const IconButton = ({ label, onClick, children }: IconButtonProps) => (
  <button
    onClick={onClick}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:text-white"
    aria-label={label}
  >
    {children}
  </button>
);

export default IconButton;
