const base = import.meta.env.BASE_URL;
const mark1x = `${base}mark-128.png?v=3`;
const mark2x = `${base}mark-256.png?v=3`;

const Logo = () => (
  <div className="logo" aria-label="Kamran Boroomand branding">
    <img
      src={mark2x}
      srcSet={`${mark1x} 1x, ${mark2x} 2x`}
      alt="Kamran Boroomand"
      loading="lazy"
      draggable={false}
    />
  </div>
);

export default Logo;
