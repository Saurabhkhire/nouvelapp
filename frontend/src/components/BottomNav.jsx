import { NavLink } from 'react-router-dom';

const items = [
  { to: '/home', label: 'Home', icon: '⌂' },
  { to: '/journal', label: 'Journal', icon: '✎' },
  { to: '/practices', label: 'Practices', icon: '❂' },
  { to: '/guide', label: 'AI Guide', icon: '✺' },
  { to: '/profile', label: 'Profile', icon: '☾' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">{i.icon}</span>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
