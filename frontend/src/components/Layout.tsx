import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '');

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="brand" end>
            <span className="brand-mark">R</span> Retain
          </NavLink>
          <button
            type="button"
            className="menu-btn"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`nav ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/expenses" end className={linkClass}>
              Expenses
            </NavLink>
            <NavLink to="/expenses/new" className={linkClass}>
              Add expense
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            )}
            <div className="nav-user">
              <span className="nav-name">
                {user?.name}
                {isAdmin && <span className="badge badge-admin">admin</span>}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
                Sign out
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
