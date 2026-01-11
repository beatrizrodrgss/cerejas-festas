import { NavLink } from 'react-router-dom';
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

export function Sidebar() {
    const navItems = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/catalog', label: 'Catálogo', icon: Package },
        { href: '/clients', label: 'Clientes', icon: Users },
        { href: '/orders', label: 'Pedidos', icon: ShoppingBag },
        { href: '/suppliers', label: 'Fornecedores', icon: Truck },
        { href: '/settings', label: 'Configurações', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col z-50">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Cherry className="w-6 h-6 text-red-500" />
                    Cerejas Festas
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                ? 'bg-red-50 text-red-600'
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
                <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                </Button>
            </div>
        </aside>
    );
}
