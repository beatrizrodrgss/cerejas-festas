import { useState, useRef } from 'react';
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
} from '../ui/select';
import { Camera, X, Upload, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ItemCategory, ItemCondition, Item, ItemLocation } from '@/types';
import { ITEM_CATEGORIES, QUANTITY_OPTIONS } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { itemStorage } from '@/lib/storage';

interface ItemFormProps {
  onSuccess: () => void;
  initialData?: Partial<Item>;
}

// Helper: Compress image to avoid QuotaExceededError
async function compressImage(base64: string, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (err) => reject(err);
  });
}

export function ItemForm({ onSuccess, initialData }: ItemFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || ItemCategory.LOUÇAS,
    description: initialData?.description || '',
    quantity_total: initialData?.quantity_total || 1,
    quantity_maintenance: initialData?.quantity_maintenance || 0,
    rental_value: initialData?.rental_value || '',
    replacement_value: initialData?.replacement_value || '',
    conservation_status: initialData?.condition || ItemCondition.NORMAL,
    damage_description: initialData?.damage_description || ''
  });

  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const processAndAddPhoto = async (base64: string) => {
    try {
      const compressed = await compressImage(base64);
      setPhotos(prev => [...prev, compressed]);
    } catch (error) {
      console.error("Compression error:", error);
      toast({
        title: 'Erro na imagem',
        description: 'Não foi possível processar a imagem.',
        variant: 'destructive'
      });
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          processAndAddPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
      // Wait for modal to open and video ref to be attached
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      toast({
        title: 'Erro na câmera',
        description: 'Não foi possível acessar a câmera. Verifique as permissões.',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg');
        processAndAddPhoto(base64);
        stopCamera();
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do item é obrigatório';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Descrição deve ter no máximo 200 caracteres';
    }

    if (!formData.rental_value || Number(formData.rental_value) <= 0) {
      newErrors.rental_value = 'Valor de locação deve ser maior que zero';
    }

    // Check if rental_value is valid number
    if (isNaN(Number(formData.rental_value))) {
      newErrors.rental_value = 'Valor inválido';
    }

    if (!formData.replacement_value || Number(formData.replacement_value) <= 0) {
      newErrors.replacement_value = 'Valor de reposição deve ser maior que zero';
    }

    if (formData.conservation_status === ItemCondition.DAMAGED && !formData.damage_description.trim()) {
      newErrors.damage_description = 'Descrição do dano é obrigatória para itens danificados';
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

    if (!user) {
      toast({
        title: 'Erro de permissão',
        description: 'Você precisa estar logado.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        quantity_total: Number(formData.quantity_total),
        quantity_maintenance: Number(formData.quantity_maintenance),
        quantity_available: Number(formData.quantity_total) - Number(formData.quantity_maintenance),
        rental_value: Number(formData.rental_value),
        replacement_value: Number(formData.replacement_value),
        condition: formData.conservation_status,
        damage_description: formData.damage_description,
        photos: photos,
        location: initialData?.location || ItemLocation.STOCK,
        created_by: user.id,
        quantity_rented: 0
      };

      if (initialData?.id) {
        itemStorage.update(initialData.id, itemData, user);
        toast({
          title: 'Item atualizado!',
          description: 'As alterações foram salvas com sucesso.'
        });
      } else {
        const newItem = itemStorage.create(itemData, user);
        toast({
          title: 'Item criado!',
          description: `${formData.name} foi cadastrado com o código ${newItem.code}.`
        });
      }

      onSuccess();
    } catch (error) {
      console.error(error);
      const isQuotaError = error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

      toast({
        title: isQuotaError ? 'Espaço cheio' : 'Erro ao salvar',
        description: isQuotaError
          ? 'Não foi possível salvar pois o armazenamento local está cheio. Tente remover fotos antigas.'
          : 'Ocorreu um erro ao salvar o item.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="name">Nome do Item *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Sousplat dourado 33cm"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity_total">Quantidade Total *</Label>
            <Select
              value={String(formData.quantity_total)}
              onValueChange={(value) => handleChange('quantity_total', Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {QUANTITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity_maintenance">Em Manutenção</Label>
            <Select
              value={String(formData.quantity_maintenance)}
              onValueChange={(value) => handleChange('quantity_maintenance', Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {Array.from({ length: formData.quantity_total + 1 }, (_, i) => i).map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rental_value">Valor de Locação (R$) *</Label>
            <Input
              id="rental_value"
              type="number"
              min="0"
              step="0.01"
              value={formData.rental_value}
              onChange={(e) => handleChange('rental_value', e.target.value)}
              placeholder="0.00"
            />
            {errors.rental_value && (
              <p className="text-sm text-red-600 mt-1">{errors.rental_value}</p>
            )}
          </div>

          <div>
            <Label htmlFor="replacement_value">Valor de Reposição (R$) *</Label>
            <Input
              id="replacement_value"
              type="number"
              min="0"
              step="0.01"
              value={formData.replacement_value}
              onChange={(e) => handleChange('replacement_value', e.target.value)}
              placeholder="0.00"
            />
            {errors.replacement_value && (
              <p className="text-sm text-red-600 mt-1">{errors.replacement_value}</p>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detalhes adicionais sobre o item..."
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="col-span-2">
            <Label className="block mb-2">Fotos</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={photo}
                    alt={`Item ${index + 1}`}
                    className="w-full h-full object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Opção 1: Upload de Arquivo */}
              <div
                className="relative w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B6B] hover:text-[#FF6B6B] transition-colors gap-1"
                onClick={() => fileInputRef.current?.click()}
                title="Carregar fotos"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-[10px] text-gray-500">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
              </div>

              {/* Opção 2: Tirar Foto na Hora */}
              <div
                className="relative w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B6B] hover:text-[#FF6B6B] transition-colors gap-1"
                onClick={startCamera}
                title="Tirar foto na hora"
              >
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-[10px] text-gray-500">Câmera</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="col-span-2 border-t pt-4">
              <Label>Status de Conservação</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="conservation_status"
                    value={ItemCondition.NORMAL}
                    checked={formData.conservation_status === ItemCondition.NORMAL}
                    onChange={() => handleChange('conservation_status', ItemCondition.NORMAL)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Normal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="conservation_status"
                    value={ItemCondition.DAMAGED}
                    checked={formData.conservation_status === ItemCondition.DAMAGED}
                    onChange={() => handleChange('conservation_status', ItemCondition.DAMAGED)}
                    className="w-4 h-4 text-red-600"
                  />
                  <span>Danificado</span>
                </label>
              </div>
            </div>
          )}

          {formData.conservation_status === ItemCondition.DAMAGED && (
            <div className="col-span-2 bg-red-50 p-4 rounded-md border border-red-100 animate-in fade-in slide-in-from-top-1">
              <Label htmlFor="damage_description" className="text-red-900">
                Descrição do Dano *
              </Label>
              <Textarea
                id="damage_description"
                value={formData.damage_description}
                onChange={(e) => handleChange('damage_description', e.target.value)}
                placeholder="Descreva o dano detectado..."
                className="border-red-200 focus-visible:ring-red-500 mt-1"
              />
              {errors.damage_description && (
                <p className="text-sm text-red-600 mt-1">{errors.damage_description}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (window.confirm('Tem certeza que deseja cancelar? Dados não salvos serão perdidos.')) {
                onSuccess();
              }
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Salvar Item
          </Button>
        </div>
      </form>

      {/* Modal da Câmera */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => {
        if (!open) stopCamera();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tirar Foto</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 w-full justify-center">
              <Button variant="outline" onClick={stopCamera}>Cancelar</Button>
              <Button onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700">
                <Camera className="w-4 h-4 mr-2" />
                Capturar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}