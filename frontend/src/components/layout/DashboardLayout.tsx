import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../lib/utils';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-40 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64',
        )}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
