import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientStatus, Client } from '@/types';
import { CLIENT_STATUSES } from '@/lib/constants';
import { validateCPF, formatCPF, formatPhone } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

interface ClientFormProps {
  onSuccess: () => void;
  initialData?: Partial<Client>;
}

export function ClientForm({ onSuccess, initialData }: ClientFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    cpf: initialData?.cpf || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    birth_date: initialData?.birth_date || '',
    status: initialData?.status || ClientStatus.ACTIVE,
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Endereço é obrigatório';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = 'Data de nascimento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os erros no formulário',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Save to database
    console.log('Saving client:', formData);

    toast({
      title: 'Cliente salvo com sucesso!',
      description: `${formData.full_name} foi cadastrado no sistema.`
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="Ex: Maria da Silva Santos"
          />
          {errors.full_name && (
            <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {errors.cpf && (
            <p className="text-sm text-red-600 mt-1">{errors.cpf}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="cliente@email.com"
          />
        </div>

        <div>
          <Label htmlFor="birth_date">Data de Nascimento *</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date}
            onChange={(e) => handleChange('birth_date', e.target.value)}
          />
          {errors.birth_date && (
            <p className="text-sm text-red-600 mt-1">{errors.birth_date}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="address">Endereço Completo *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Rua, número, bairro, cidade - UF"
          />
          {errors.address && (
            <p className="text-sm text-red-600 mt-1">{errors.address}</p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Informações adicionais sobre o cliente..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Salvar Cliente
        </Button>
      </div>
    </form>
  );
}