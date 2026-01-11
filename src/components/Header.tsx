import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Users,
    Package,
    FileText,
    DollarSign,
    Image,
    Truck,
    LogOut
} from 'lucide-react';

export function Header() {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user || location.pathname === '/login') {
        return null;
    }

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/clients', label: 'Clientes', icon: Users },
        { path: '/items', label: 'Itens', icon: Package },
        { path: '/orders', label: 'Pedidos', icon: FileText },
        { path: '/finance', label: 'Financeiro', icon: DollarSign },
        { path: '/suppliers', label: 'Fornecedores', icon: Truck },
        { path: '/gallery', label: 'Galeria', icon: Image },
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#FF6B6B] flex items-center justify-center">
                            <span className="text-white font-bold text-sm">CF</span>
                        </div>
                        <span className="font-bold text-lg hidden sm:inline">Cerejas Festas</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-[#FF6B6B] text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-600 hover:text-red-600"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">Sair</span>
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-4 px-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${isActive
                                        ? 'bg-[#FF6B6B] text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
