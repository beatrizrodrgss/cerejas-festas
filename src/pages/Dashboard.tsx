import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Calendar, Wrench, TrendingUp, Plus } from 'lucide-react';
import { orderStorage, itemStorage } from '@/lib/storage';
import { Order } from '@/types';
import { format } from 'date-fns';

interface Stats {
  availableItems: number;
  activeRentals: number;
  maintenanceItems: number;
  totalRevenue: number;
}

interface StoredItem {
  status: string;
}

interface StoredRental {
  status: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    availableItems: 0,
    activeRentals: 0,
    maintenanceItems: 0,
    totalRevenue: 0,
  });
  const [upcomingReturns, setUpcomingReturns] = useState<Order[]>([]);

  useEffect(() => {
    // Load stats from localStorage
    const items = itemStorage.getAll();
    const orders = orderStorage.getAll();

    // Available items (Quantity Available > 0 AND Condition is Normal)
    // Actually simpler: Sum of available quantities of all items
    // But card says "Itens Disponiveis". Usually means unique items or total quantity?
    // Let's assume Unique Items that have availability > 0
    const availableItems = items.filter(i => i.quantity_available > 0).length;

    // Active Rentals (Status is Picked Up or Confirmed)
    const activeRentals = orders.filter(
      (o) => o.status === 'PICKED_UP' || o.status === 'CONFIRMED_PAID' || o.status === 'DELIVERED'
    ).length;

    // Maintenance (Items with quantity_maintenance > 0)
    const maintenanceItems = items.filter((i) => (i.quantity_maintenance || 0) > 0).length;

    // Revenue (Sum of total_value of Paid orders)
    // Paid orders = CONFIRMED_PAID, DELIVERED, RETURNED
    const revenueOrders = orders.filter(o =>
      ['CONFIRMED_PAID', 'DELIVERED', 'RETURNED'].includes(o.status)
    );
    const totalRevenue = revenueOrders.reduce((acc, curr) => acc + (curr.total_value || 0), 0);

    setStats({
      availableItems,
      activeRentals,
      maintenanceItems,
      totalRevenue,
    });

    // Load upcoming returns
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = orders
      .filter(order => {
        if (order.status !== 'CONFIRMED_PAID' && order.status !== 'DELIVERED') return false;
        if (!order.return_date) return false;

        const returnDate = new Date(order.return_date);
        returnDate.setHours(0, 0, 0, 0);

        return returnDate >= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.return_date!).getTime();
        const dateB = new Date(b.return_date!).getTime();
        return dateA - dateB;
      })
      .slice(0, 5);

    setUpcomingReturns(upcoming);
  }, []);

  const statCards = [
    {
      title: 'Itens Disponíveis',
      value: stats.availableItems,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/items?filter=available'),
    },
    {
      title: 'Locações Ativas',
      value: stats.activeRentals,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => navigate('/orders?status=active'),
    },
    {
      title: 'Em Manutenção',
      value: stats.maintenanceItems,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => navigate('/items?filter=maintenance'),
    },
    {
      title: 'Receita do Mês',
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-[#FF6B6B]',
      bgColor: 'bg-red-50',
      onClick: () => navigate('/finance'),
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-[#FF6B6B] hover:bg-[#FF5252]">
            <Link to="/items">
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/orders/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Locação
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/items">
                <Package className="h-4 w-4 mr-2" />
                Ver Catálogo Completo
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/orders">
                <Calendar className="h-4 w-4 mr-2" />
                Gerenciar Locações
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Package className="h-4 w-4 mr-2" />
              Escanear QR Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas Devoluções</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingReturns.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhuma devolução pendente</p>
            ) : (
              <div className="space-y-3">
                {upcomingReturns.map((order) => (
                  <div key={order.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{order.client_name}</p>
                      <p className="text-gray-500 text-xs">{order.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-[#FF6B6B]">
                        {order.return_date ? format(new Date(order.return_date), 'dd/MM/yyyy') : '-'}
                      </p>
                      <p className="text-gray-500 text-xs">{order.items.length} itens</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}