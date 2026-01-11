import { useState } from 'react';
import { Eye, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CLIENT_STATUSES } from '@/lib/constants';
import { formatCPF, formatPhone, formatCurrency } from '@/lib/formatters';
import { Client, ClientStatus } from '@/types';

interface ClientTableProps {
  searchTerm: string;
}

export function ClientTable({ searchTerm }: ClientTableProps) {
  // Mock data - will be replaced with real data from database
  const [clients] = useState<Client[]>([
    {
      id: '1',
      full_name: 'Maria Silva Santos',
      cpf: '12345678901',
      phone: '11987654321',
      email: 'maria@email.com',
      address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
      birth_date: '1990-05-15',
      status: ClientStatus.ACTIVE,
      total_spent: 12500.00,
      notes: 'Cliente VIP',
      created_at: '2025-01-10T10:00:00',
      updated_at: '2025-01-10T10:00:00'
    },
    {
      id: '2',
      full_name: 'João Pedro Costa',
      cpf: '98765432100',
      phone: '11976543210',
      email: 'joao@email.com',
      address: 'Av. Principal, 456 - Jardins - São Paulo/SP',
      birth_date: '1985-08-22',
      status: ClientStatus.ACTIVE,
      total_spent: 8300.00,
      created_at: '2025-02-15T14:30:00',
      updated_at: '2025-02-15T14:30:00'
    },
    {
      id: '3',
      full_name: 'Ana Paula Oliveira',
      cpf: '45678912300',
      phone: '11965432109',
      email: 'ana@email.com',
      address: 'Rua do Comércio, 789 - Vila Nova - São Paulo/SP',
      birth_date: '1992-12-03',
      status: ClientStatus.DEFAULTER,
      total_spent: 5600.00,
      notes: 'Pagamento pendente do último evento',
      created_at: '2025-03-20T09:15:00',
      updated_at: '2025-03-20T09:15:00'
    }
  ]);

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      client.full_name.toLowerCase().includes(search) ||
      client.cpf.includes(search.replace(/\D/g, '')) ||
      client.phone.includes(search.replace(/\D/g, ''))
    );
  });

  const getStatusConfig = (status: ClientStatus) => {
    return CLIENT_STATUSES.find(s => s.value === status) || CLIENT_STATUSES[0];
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const statusConfig = getStatusConfig(client.status);
                  return (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{client.full_name}</p>
                          <p className="text-sm text-gray-500">{client.address.split('-')[0]}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCPF(client.cpf)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {formatPhone(client.phone)}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={client.status}
                          label={statusConfig.label}
                          colorClass={statusConfig.color}
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(client.total_spent)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}