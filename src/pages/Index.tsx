import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Package, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  quantity_available: number;
  quantity_total: number;
  value_per_day?: number;
  fragility_notes?: string;
  photos: string[];
  created_at: string;
}

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cerejas_items') || '[]');
    const foundItem = items.find((i: Item) => i.id === id);
    if (foundItem) {
      setItem(foundItem);
    } else {
      navigate('/catalog');
    }
  }, [id, navigate]);

  if (!item) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      AVAILABLE: { label: 'Disponível', className: 'bg-green-100 text-green-800' },
      RESERVED: { label: 'Reservado', className: 'bg-blue-100 text-blue-800' },
      OUT: { label: 'Locado', className: 'bg-purple-100 text-purple-800' },
      IN_EVENT: { label: 'Em Evento', className: 'bg-indigo-100 text-indigo-800' },
      MAINTENANCE: { label: 'Manutenção', className: 'bg-orange-100 text-orange-800' },
      LOST: { label: 'Perdido', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || statusConfig.AVAILABLE;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/catalog')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {item.photos && item.photos.length > 0 ? (
                  <img
                    src={item.photos[selectedPhoto]}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Package className="h-24 w-24 text-gray-400" />
                )}
              </div>
              {item.photos && item.photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        selectedPhoto === index ? 'border-[#FF6B6B]' : 'border-gray-200'
                      }`}
                    >
                      <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Descrição</h3>
                <p className="mt-1">{item.description || 'Sem descrição'}</p>
              </div>
              {item.fragility_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Notas de Fragilidade</h3>
                  <p className="mt-1 text-orange-600">{item.fragility_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{item.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Código: {item.code}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {getStatusBadge(item.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quantidade</span>
                <span className="font-semibold">
                  {item.quantity_available}/{item.quantity_total}
                </span>
              </div>
              {item.value_per_day && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Valor/Dia</span>
                  <span className="font-semibold text-[#FF6B6B]">
                    R$ {item.value_per_day.toFixed(2)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={item.code} size={200} />
              </div>
              <p className="text-sm text-gray-600 mt-4 text-center">
                Escaneie para identificar este item
              </p>
              <Button variant="outline" className="mt-4 w-full">
                Imprimir Etiqueta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}