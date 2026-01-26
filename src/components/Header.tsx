import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { routes } from '../utils/routes';

const Header = () => (
  <header className="site-header">
    <div className="header-content">
      <Logo />
      <nav className="nav" aria-label="Primary">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link--active' : ''}`
            }
          >
            {route.label}
          </NavLink>
        ))}
      </nav>
      <button className="cta">Launch NullCAL</button>
    </div>
  </header>
);

export default Header;
