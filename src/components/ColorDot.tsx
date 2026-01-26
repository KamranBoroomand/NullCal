type ColorDotProps = {
  color: string;
  active?: boolean;
};

const ColorDot = ({ color, active = true }: ColorDotProps) => (
  <span
    className={`h-2.5 w-2.5 rounded-full ${active ? '' : 'opacity-40'}`}
    style={{ backgroundColor: color }}
  />
);

export default ColorDot;
