import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supplierStorage } from '@/lib/storage';
import { Supplier } from '@/types';

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    supplies: '',
    notes: ''
  });

  const loadSuppliers = () => {
    setSuppliers(supplierStorage.getAll());
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      supplies: supplier.supplies.join(', '), // Convert array to string for input
      notes: supplier.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        // Need to implement delete in storage first if not exists, but for now assuming it might be missing
        // Wait, I checked storage.ts and it DID NOT have delete method for suppliers.
        // I need to add it or use a workaround. I will update storage.ts first.
        // Actually, I'll assume I'll update storage.ts in next step.

        // Temporary workaround: manually filter and save
        const all = supplierStorage.getAll();
        const newAll = all.filter(s => s.id !== id);
        localStorage.setItem('cerejas_suppliers', JSON.stringify(newAll)); // Direct access to fix missing method
        toast.success('Fornecedor excluído!');
        loadSuppliers();
      } catch (error) {
        toast.error('Erro ao excluir');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const supplierData = {
        name: formData.name,
        contact_name: formData.contact_name,
        phone: formData.phone,
        email: formData.email,
        supplies: formData.supplies.split(',').map(s => s.trim()).filter(Boolean),
        notes: formData.notes
      };

      if (editingSupplier) {
        // Update logic - manually since update method might be missing in storage.ts
        const all = supplierStorage.getAll();
        const index = all.findIndex(s => s.id === editingSupplier.id);
        if (index !== -1) {
          all[index] = { ...all[index], ...supplierData, updated_at: new Date().toISOString() };
          localStorage.setItem('cerejas_suppliers', JSON.stringify(all));
          toast.success('Editado com sucesso!');
        }
      } else {
        supplierStorage.create(supplierData, user);
        toast.success('Criado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingSupplier(null);
      setFormData({ name: '', contact_name: '', phone: '', email: '', supplies: '', notes: '' });
      loadSuppliers();
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplies.some(supply => supply.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600 mt-1">Gerencie seus parceiros e fornecedores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingSupplier(null);
            setFormData({ name: '', contact_name: '', phone: '', email: '', supplies: '', notes: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Decor Flores" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Contato</Label>
                  <Input value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} placeholder="João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(92) 99999-9999" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contato@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>O que fornece? (Separado por vírgula)</Label>
                <Input value={formData.supplies} onChange={e => setFormData({ ...formData, supplies: e.target.value })} placeholder="Flores, Balões, Doces" />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fornecedores..."
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Fornece</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Nenhum fornecedor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.email}</div>
                    </TableCell>
                    <TableCell>
                      <div>{supplier.contact_name || '-'}</div>
                      <div className="text-sm text-gray-500">{supplier.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {supplier.supplies.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(supplier.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}