import { Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from "@/components/common/StatusBadge";
import { Item, ItemLocation, ItemCondition } from '@/types';
import { ITEM_LOCATIONS, ITEM_CONDITIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';

interface ItemTableProps {
  items: Item[];
  onView?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
}

export function ItemTable({ items, onView, onEdit, onDelete }: ItemTableProps) {
  const getStatusConfig = (condition: ItemCondition) => {
    return ITEM_CONDITIONS.find(s => s.value === condition) || ITEM_CONDITIONS[0];
  };

  const getLocationLabel = (location: ItemLocation) => {
    return ITEM_LOCATIONS.find(l => l.value === location)?.label || location;
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Conservação</TableHead>
                <TableHead className="text-right">Valor Locação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Nenhum item encontrado
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const statusConfig = getStatusConfig(item.condition);
                  const safeAvailable = item.quantity_available ?? (item.quantity_total - (item.quantity_maintenance || 0));
                  const availabilityPercent = (safeAvailable / item.quantity_total) * 100;

                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-medium">
                        {item.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {safeAvailable}/{item.quantity_total}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${availabilityPercent > 50
                                ? 'bg-green-600'
                                : availabilityPercent > 20
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                                }`}
                              style={{ width: `${availabilityPercent}%` }}
                            />
                          </div>
                          {(item.quantity_maintenance || 0) > 0 && (
                            <p className="text-[10px] text-red-500 mt-0.5">{item.quantity_maintenance} em manutenção</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gray-50 whitespace-nowrap"
                        >
                          {getLocationLabel(item.location)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            status={item.condition}
                            label={statusConfig.label}
                            colorClass={statusConfig.color}
                          />
                          {item.condition === ItemCondition.DAMAGED && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(item.rental_value) || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalhes"
                            onClick={() => onView?.(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => onEdit?.(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete?.(item)}
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