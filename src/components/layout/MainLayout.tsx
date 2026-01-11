import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar (Overlay + Component) */}
      <div className={`fixed inset-0 z-50 md:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* Sidebar */}
        <Sidebar
          className={`transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
        {/* Mobile Header Trigger */}
        <div className="md:hidden p-4 bg-white border-b flex items-center gap-4 sticky top-0 z-40">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <span className="font-bold text-lg">Cerejas Festas</span>
        </div>

        <div className="flex-1">
          <Header />
          <main className="p-4 md:p-6 overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}