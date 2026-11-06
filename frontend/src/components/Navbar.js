import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Home, Calculator, Users, Car, ClipboardList, LayoutDashboard, Star, Menu, X } from 'lucide-react';
import { LogoMark, LogoWordmark } from './Logo';

// لینک‌های منو (اسم، آدرس، آیکن)
const links = [
  { to: '/', label: 'خانه', icon: Home },
  { to: '/predict', label: 'خدمات مشتری', icon: Calculator },
  { to: '/customer', label: 'ثبت مشتری', icon: Users },
  { to: '/vehicle', label: 'ثبت خودرو', icon: Car },
  { to: '/service-order', label: 'ثبت پذیرش', icon: ClipboardList },
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { to: '/survey', label: 'نظرسنجی', icon: Star },
];

function Navbar() {
  const [open, setOpen] = useState(false);   // باز یا بسته بودن منو در موبایل

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={() => setOpen(false)}>
          <LogoMark size={52} simple />
          <span className="logo-text">
            <LogoWordmark height={34} className="logo-word" />
            <small>مدیریت هوشمند خدمات</small>
          </span>
        </Link>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="منو">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`nav-menu ${open ? 'open' : ''}`}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
