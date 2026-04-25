import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Crown, AlertCircle, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Kullanıcılar', icon: Users },
  { href: '/activate', label: 'Premium Aktifleştir', icon: Crown },
  { href: '/complaints', label: 'Şikayetler', icon: AlertCircle },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pt-0">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            onNavigate?.();
            logout();
          }}
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 md:hidden">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Menüyü aç"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold">SyntGPT Admin</span>
          </div>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Menüyü kapat"
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-card border-r border-border">
            <div className="flex h-14 items-center justify-between gap-3 border-b border-border px-4">
              <div className="flex items-center gap-3">
                <img src="/logo.jpg" alt="SyntGPT" className="w-12 h-12 rounded-full object-cover" />
                <span className="font-bold">SyntGPT Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Menüyü kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Nav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <aside className="hidden md:block fixed left-0 top-0 z-40 h-full w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <img src="/logo.jpg" alt="SyntGPT" className="w-12 h-12 rounded-full object-cover" />
          <span className="font-bold">SyntGPT Admin</span>
        </div>

        <Nav />
      </aside>

      <main className="md:pl-64">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
