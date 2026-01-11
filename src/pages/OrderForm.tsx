
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clientStorage, itemStorage, orderStorage } from '@/lib/storage';
import { Client, Item, PartyType, PaymentMethod, OrderStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function OrderForm() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [clients, setClients] = useState<Client[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    const [formData, setFormData] = useState({
        client_id: '',
        party_type: PartyType.PEGUE_MONTE,
        reservation_date: '', // For non-PEGUE_MONTE
        event_date: '', // For non-PEGUE_MONTE
        pickup_date: '',
        return_date: '',
        payment_method: PaymentMethod.PIX,
        status: OrderStatus.CONFIRMED_PAID,
        observations: '' // New field
    });

    const [inspirationPhoto, setInspirationPhoto] = useState<string | null>(null);

    const [selectedItems, setSelectedItems] = useState<Array<{ item_id: string; quantity: number }>>([]);

    useEffect(() => {
        setClients(clientStorage.getAll());
        setItems(itemStorage.getAll());
    }, []);

    const handleAddItem = () => {
        setSelectedItems([...selectedItems, { item_id: '', quantity: 1 }]);
    };

    const updateItem = (index: number, field: 'item_id' | 'quantity', value: string | number) => {
        const newItems = [...selectedItems];
        if (field === 'quantity') {
            newItems[index][field] = Number(value);
        } else {
            newItems[index][field] = value as string;
        }
        setSelectedItems(newItems);
    };

    const removeItem = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return selectedItems.reduce((acc, row) => {
            const item = items.find(i => i.id === row.item_id);
            return acc + (item ? item.rental_value * row.quantity : 0);
        }, 0);
    };

    const [total, setTotal] = useState(0);

    useEffect(() => {
        setTotal(calculateTotal());
    }, [selectedItems, items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!user) throw new Error('Usuário não autenticado');
            if (selectedItems.length === 0) throw new Error('Adicione pelo menos um item');
            if (selectedItems.some(i => !i.item_id || i.quantity <= 0)) throw new Error('Preencha os itens corretamente');

            const client = clients.find(c => c.id === formData.client_id);
            if (!client) throw new Error('Selecione um cliente');

            const orderItems = selectedItems.map(row => {
                const item = items.find(i => i.id === row.item_id);
                if (!item) throw new Error('Item inválido');
                return {
                    id: crypto.randomUUID(),
                    order_id: '',
                    item_id: item.id,
                    item_code: item.code,
                    item_name: item.name,
                    quantity: Number(row.quantity),
                    unit_value: item.rental_value,
                    total_value: item.rental_value * Number(row.quantity)
                };
            });

            const orderData = {
                client_id: client.id,
                client_name: client.full_name,
                party_type: formData.party_type,
                pickup_date: formData.pickup_date,
                pickup_time: '10:00',
                return_date: formData.return_date,
                return_time: '10:00',
                items: orderItems,
                total_value: total,
                payment_method: formData.payment_method,
                amount_paid: total,
                amount_pending: 0,
                status: formData.status,
                inspiration_photos: inspirationPhoto ? [inspirationPhoto] : [],
                assembly_photos: [],
                created_by: user.id
            };

            // Add conditional dates for non-PEGUE_MONTE
            if (formData.party_type !== PartyType.PEGUE_MONTE) {
                Object.assign(orderData, {
                    assembly_date: formData.reservation_date,
                    disassembly_date: formData.event_date
                });
            }

            const newOrder = orderStorage.create(orderData, user);

            toast.success(`Pedido ${newOrder.code} criado com sucesso!`);
            navigate('/orders');
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erro desconhecido');
            }
        }
    };

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

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const compressed = await compressImage(reader.result as string);
                    setInspirationPhoto(compressed);
                } catch (error) {
                    toast.error('Erro ao processar imagem');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>Nova Locação</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cliente</Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o Cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de Festa</Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, party_type: v as PartyType })} defaultValue={formData.party_type}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.values(PartyType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Conditional Date Fields */}
                            {formData.party_type !== PartyType.PEGUE_MONTE && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Data da Reserva</Label>
                                        <Input type="date" value={formData.reservation_date} onChange={e => setFormData({ ...formData, reservation_date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Data do Evento</Label>
                                        <Input type="date" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Data Retirada</Label>
                                <Input type="date" value={formData.pickup_date} onChange={e => setFormData({ ...formData, pickup_date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Devolução</Label>
                                <Input type="date" value={formData.return_date} onChange={e => setFormData({ ...formData, return_date: e.target.value })} />
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-2">
                                <Label>Forma de Pagamento</Label>
                                <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v as PaymentMethod })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={PaymentMethod.PIX}>PIX</SelectItem>
                                        <SelectItem value={PaymentMethod.CASH}>Dinheiro</SelectItem>
                                        <SelectItem value={PaymentMethod.CREDIT}>Crédito</SelectItem>
                                        <SelectItem value={PaymentMethod.DEBIT}>Débito</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Image Upload */}
                            <div className="col-span-2 space-y-2">
                                <Label>Imagem de Referência (Opcional)</Label>
                                <div className="flex items-center gap-4">
                                    <Input type="file" accept="image/*" onChange={handlePhotoUpload} className="max-w-sm" />
                                    {inspirationPhoto && (
                                        <div className="relative">
                                            <img src={inspirationPhoto} alt="Referência" className="w-24 h-24 object-cover rounded border" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                                                onClick={() => setInspirationPhoto(null)}
                                            >
                                                X
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Observations */}
                            <div className="col-span-2 space-y-2">
                                <Label>Observações</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.observations}
                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                    placeholder="Informações adicionais sobre a locação..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2 border p-4 rounded-md">
                            <div className="flex justify-between items-center">
                                <Label className="text-lg">Itens</Label>
                                <Button type="button" onClick={handleAddItem} variant="secondary" size="sm">Adicionar Item</Button>
                            </div>
                            {selectedItems.map((row, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Label className="text-xs">Item</Label>
                                        <Select onValueChange={(v) => updateItem(index, 'item_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {items.map(i => (
                                                    <SelectItem key={i.id} value={i.id}>{i.name} (Disp: {i.quantity_total})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24">
                                        <Label className="text-xs">Qtd</Label>
                                        <Input type="number" min="1" value={row.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                                    </div>
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}>X</Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center border-t pt-4">
                            <div className="text-xl font-bold">Total: R$ {total.toFixed(2)}</div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => navigate('/orders')}>Cancelar</Button>
                                <Button type="submit" className="bg-[#FF6B6B] hover:bg-[#FF5252]">Salvar Pedido</Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
