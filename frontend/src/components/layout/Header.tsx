import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Bell,
  Menu,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { generateAvatarUrl } from '../../lib/utils';
import Toggle from '../ui/Toggle';
import Dropdown from '../ui/Dropdown';
import Button from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/links?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 glass-nav h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search links..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
            </div>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/links?create=true')}
            className="hidden sm:inline-flex"
          >
            New Link
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/links?create=true')}
            className="sm:hidden"
          >
            <span className="sr-only">New</span>
          </Button>

          {/* Dark mode toggle */}
          <Toggle
            enabled={theme === 'dark'}
            onChange={toggleTheme}
            showIcons
          />

          {/* Notifications */}
          <button className="relative p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500 ring-2 ring-white dark:ring-surface-950" />
          </button>

          {/* User dropdown */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <img
                  src={user?.avatar || generateAvatarUrl(user?.name || 'User')}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full ring-2 ring-surface-200 dark:ring-surface-700"
                />
              </button>
            }
            items={[
              {
                label: 'Profile',
                icon: <User className="w-4 h-4" />,
                onClick: () => navigate('/dashboard/settings'),
              },
              {
                label: 'Settings',
                icon: <Settings className="w-4 h-4" />,
                onClick: () => navigate('/dashboard/settings'),
              },
              {
                label: 'Logout',
                icon: <LogOut className="w-4 h-4" />,
                onClick: () => {
                  logout();
                  navigate('/login');
                },
                danger: true,
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
