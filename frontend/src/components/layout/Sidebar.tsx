import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Users2,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { generateAvatarUrl } from '../../lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onCloseMobile?: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/links', label: 'Links', icon: Link2 },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/teams', label: 'Teams', icon: Users2 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-white dark:bg-surface-950',
        'border-r border-surface-200 dark:border-surface-800',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-surface-200 dark:border-surface-800', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-xl font-bold gradient-text">Linkly</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = to === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200',
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-primary-500')} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-2 border-t border-surface-200 dark:border-surface-800">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* User */}
      <div className={cn('px-3 py-3 border-t border-surface-200 dark:border-surface-800', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <img
            src={user?.avatar || generateAvatarUrl(user?.name || 'User')}
            alt={user?.name}
            className="w-8 h-8 rounded-full ring-2 ring-surface-200 dark:ring-surface-700 shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
