
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileDown, Trash2 } from 'lucide-react';
import { orderStorage } from '@/lib/storage';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { generateOrderPDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setOrders(orderStorage.getAll());
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const confirmDelete = () => {
    if (!user || !orderToDelete) return;
    try {
      orderStorage.delete(orderToDelete.id, user);
      setOrders(orderStorage.getAll()); // Refresh list
      toast.success('Pedido excluído com sucesso');
    } catch (error) {
      toast.error('Erro ao excluir pedido');
    } finally {
      setOrderToDelete(null);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
  };

  const filteredOrders = orders.filter((order) =>
    order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<string, { label: string; className: string }> = {
      QUOTE: { label: 'Orçamento', className: 'bg-gray-100 text-gray-800' },
      CONFIRMED_PAID: { label: 'Confirmado - Pago', className: 'bg-green-100 text-green-800' },
      DELIVERED: { label: 'Entregue', className: 'bg-blue-100 text-blue-800' },
      RETURNED: { label: 'Devolvido', className: 'bg-purple-100 text-purple-800' },
    };
    const c = config[status] || config.QUOTE;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const handleDownloadPDF = (order: Order) => {
    try {
      generateOrderPDF(order);
      toast.success('Contrato gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">Gerencie locações e orçamentos</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/orders/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Locação
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {paginatedOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium">
                  {order.code} - {order.client_name}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Tipo: {order.party_type}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Retirada</p>
                  <p>{order.pickup_date ? order.pickup_date.split('-').reverse().join('/') : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Devolução</p>
                  <p>{order.return_date ? order.return_date.split('-').reverse().join('/') : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Itens</p>
                  <p>{order.items.length} itens</p>
                </div>
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className="font-semibold text-primary">R$ {(order.total_value ?? 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(order)}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Baixar Contrato
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(order)}
                  className="gap-2 ml-2"
                  title="Excluir Pedido"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {paginatedOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nenhum pedido encontrado.</div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pedido <strong>{orderToDelete?.code}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir Definifivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
