
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, Trash2 } from 'lucide-react';
import { clientStorage } from '@/lib/storage';
import { Client } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    setClients(clientStorage.getAll());
  };

  const handleDelete = (e: React.MouseEvent, client: Client) => {
    e.preventDefault(); // Prevent Link navigation
    setClientToDelete(client);
  };

  const confirmDelete = () => {
    if (clientToDelete && user) {
      try {
        clientStorage.delete(clientToDelete.id, user);
        toast.success('Cliente excluído com sucesso!');
        loadClients();
        setClientToDelete(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao excluir cliente');
      }
    }
  };

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.cpf.includes(searchQuery)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gerencie sua base de clientes</p>
        </div>
        <Button asChild className="bg-[#FF6B6B] hover:bg-[#FF5252]">
          <Link to="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Link key={client.id} to={`/clients/${client.id}`} className="block">
            <Card className="hover:shadow-md transition-all hover:border-blue-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  {client.full_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => handleDelete(e, client)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p><span className="font-semibold">CPF:</span> {client.cpf}</p>
                  <p><span className="font-semibold">Tel:</span> {client.phone}</p>
                  <p className="truncate"><span className="font-semibold">End:</span> {client.address}</p>
                  {client.notes && (
                    <div className="mt-2 text-yellow-700 bg-yellow-50 p-1.5 rounded text-[11px] border border-yellow-100 flex items-start gap-1">
                      <span className="font-bold shrink-0">Nota:</span>
                      <span className="line-clamp-2">{client.notes}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}