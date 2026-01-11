import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingBag,
    Truck,
    Settings,
    LogOut,
    Cherry
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    className?: string;
    onClose?: () => void;
}

export function Sidebar({ className = "", onClose }: SidebarProps) {
    const { logout } = useAuth();
    const navItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/catalog', label: 'Catálogo', icon: Package },
        { href: '/clients', label: 'Clientes', icon: Users },
        { href: '/orders', label: 'Pedidos', icon: ShoppingBag },
        { href: '/suppliers', label: 'Fornecedores', icon: Truck },
        { href: '/settings', label: 'Configurações', icon: Settings },
    ];

    return (
        <aside className={`w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ${className}`}>
            <div className="p-6 border-b flex justify-between items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
                    <Cherry className="w-6 h-6 text-primary" />
                    Cerejas Festas
                </h1>
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-gray-500">
                        <LogOut className="w-5 h-5 rotate-180" />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>


            <div className="p-4 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-destructive hover:bg-destructive/10"
                    onClick={logout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                </Button>
            </div>
        </aside>
    );
}
