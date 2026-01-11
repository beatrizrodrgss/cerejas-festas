import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { ItemTable } from '@/components/items/ItemTable';
import { ItemForm } from '@/components/items/ItemForm';
import { itemStorage } from '@/lib/storage';
import { ITEM_CATEGORIES } from '@/lib/constants';
import { Item } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadItems = () => {
    const allItems = itemStorage.getAll();
    setItems(allItems);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    loadItems();
  };

  const handleView = (item: Item) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem && user) {
      try {
        itemStorage.delete(selectedItem.id, user);
        toast.success('Item excluído com sucesso!');
        loadItems();
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao excluir item');
      }
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedItem(null);
    loadItems();
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, itemsPerPage]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de Itens</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu acervo de produtos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Item</DialogTitle>
            </DialogHeader>
            <ItemForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Categoria" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {ITEM_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ItemTable
        items={paginatedItems}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Itens por página:</Label>
          <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} de {filteredItems.length}
          </span>
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
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, idx, arr) => (
                <>
                  {idx > 0 && arr[idx - 1] !== page - 1 && <span key={`ellipsis-${page}`}>...</span>}
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                </>
              ))
            }
          </div>
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                  <p className="text-gray-500 font-mono">{selectedItem.code}</p>
                </div>
                <Badge variant={selectedItem.condition === 'DAMAGED' ? 'destructive' : 'outline'}>
                  {selectedItem.condition === 'NORMAL' ? 'Normal' : 'Danificado'}
                </Badge>
              </div>

              {/* Photos Grid */}
              {selectedItem.photos && selectedItem.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Fotos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedItem.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Foto ${i}`} className="w-full h-32 object-cover rounded-lg border" />
                    ))}
                  </div>
                </div>
              )}

              {/* Main Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-gray-500">Categoria</Label>
                  <p className="font-medium capitalize">{selectedItem.category}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Localização</Label>
                  <p className="font-medium">{selectedItem.location || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Valor Locação</Label>
                  <p className="font-bold text-[#FF6B6B]">R$ {Number(selectedItem.rental_value).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Valor Reposição</Label>
                  <p className="font-medium">R$ {Number(selectedItem.replacement_value).toFixed(2)}</p>
                </div>
              </div>

              {/* Stock Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Estoque e Disponibilidade</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Total</Label>
                    <p className="text-xl font-bold">{selectedItem.quantity_total}</p>
                  </div>
                  <div>
                    <Label>Em Manutenção</Label>
                    <p className="text-xl font-bold text-yellow-600">{selectedItem.quantity_maintenance || 0}</p>
                  </div>
                  <div>
                    <Label>Disponível</Label>
                    <p className="text-xl font-bold text-green-600">{selectedItem.quantity_available}</p>
                  </div>
                </div>
              </div>

              {/* Maintenance / Damage Info */}
              {selectedItem.condition === 'DAMAGED' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <h3 className="font-semibold text-red-700 mb-1">Registro de Dano</h3>
                  <p className="text-red-600">{selectedItem.damage_description || 'Sem descrição do dano.'}</p>
                </div>
              )}

              {/* Description */}
              {selectedItem.description && (
                <div>
                  <Label className="text-gray-500">Descrição Detalhada</Label>
                  <p className="mt-1 text-gray-700">{selectedItem.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <ItemForm initialData={selectedItem} onSuccess={handleEditSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item <strong>{selectedItem?.name}</strong>?
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