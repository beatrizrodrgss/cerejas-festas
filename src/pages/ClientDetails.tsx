
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientStorage, orderStorage } from '@/lib/storage';
import { Client, Order, ClientStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ClientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [notes, setNotes] = useState('');
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    useEffect(() => {
        if (id) {
            const foundClient = clientStorage.getById(id);
            if (foundClient) {
                setClient(foundClient);
                setNotes(foundClient.notes || '');
                // Load orders
                const clientOrders = orderStorage.getByClient(id);
                setOrders(clientOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            } else {
                toast.error('Cliente não encontrado');
                navigate('/clients');
            }
        }
    }, [id, navigate]);

    const handleSaveNotes = () => {
        if (!client || !user) return;
        try {
            clientStorage.update(client.id, { notes }, user);
            setClient({ ...client, notes });
            setIsEditingNotes(false);
            toast.success('Observações atualizadas');
        } catch (error) {
            toast.error('Erro ao atualizar observações');
        }
    };

    if (!client) return null;

    const totalSpent = orders.reduce((sum, order) => {
        if (['CONFIRMED_PAID', 'DELIVERED', 'RETURNED'].includes(order.status)) {
            return sum + (order.total_value || 0);
        }
        return sum;
    }, 0);

    const getStatusBadge = (status: ClientStatus) => {
        const map = {
            [ClientStatus.ACTIVE]: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
            [ClientStatus.DEFAULTER]: { label: 'Inadimplente', className: 'bg-red-100 text-red-800' },
            [ClientStatus.BLOCKED]: { label: 'Bloqueado', className: 'bg-gray-800 text-white' }
        };
        const config = map[status] || map[ClientStatus.ACTIVE];
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate('/clients')} className="pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Clientes
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info & Notes */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{client.full_name}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">CPF: {client.cpf}</p>
                                </div>
                                {getStatusBadge(client.status)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{client.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{client.email || 'Não informado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{client.address}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>Nasc: {format(new Date(client.birth_date), 'dd/MM/yyyy')}</span>
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-sm">Total Gasto</h3>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        R$ {totalSpent.toFixed(2)}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <CardTitle className="text-base">Observações Internas</CardTitle>
                            {!isEditingNotes && (
                                <Button variant="ghost" size="icon" onClick={() => setIsEditingNotes(true)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {isEditingNotes ? (
                                <div className="space-y-2">
                                    <Textarea
                                        className="min-h-[100px]"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Ex: Cliente sempre atrasa..."
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleSaveNotes}>Salvar</Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {client.notes || 'Nenhuma observação registrada.'}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Order History */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Histórico de Pedidos ({orders.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {orders.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">Nenhum pedido realizado ainda.</p>
                                ) : (
                                    orders.map(order => (
                                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{order.code}</span>
                                                    <Badge variant="outline" className="text-xs">{order.party_type}</Badge>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(order.created_at), 'dd/MM/yyyy')} • {order.items.length} itens
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-sm">R$ {order.total_value.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{order.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
