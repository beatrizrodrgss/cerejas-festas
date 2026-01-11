
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { clientStorage } from '@/lib/storage';
import { ClientStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { validateCPF, formatCPF } from '@/lib/validators';

export default function ClientForm() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cpfError, setCpfError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        cpf: '',
        phone: '',
        email: '',
        address: '',
        birthDate: '',
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!user) throw new Error('Usuário não autenticado');

            // Validate CPF
            if (!validateCPF(formData.cpf)) {
                setCpfError('CPF inválido');
                toast.error('Por favor, insira um CPF válido');
                return;
            }

            clientStorage.create({
                full_name: formData.full_name,
                cpf: formData.cpf.replace(/\D/g, ''), // Save only digits
                phone: formData.phone,
                email: formData.email || undefined,
                address: formData.address,
                birth_date: formData.birthDate,
                notes: formData.notes,
                status: ClientStatus.ACTIVE
            }, user);

            toast.success('Cliente cadastrado com sucesso!');
            navigate('/clients');
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erro desconhecido');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'cpf') {
            // Format CPF as user types and validate
            const formatted = formatCPF(value);
            setFormData({ ...formData, cpf: formatted });

            // Clear error when user starts typing
            if (cpfError) setCpfError('');

            // Validate if complete
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length === 11) {
                if (!validateCPF(digitsOnly)) {
                    setCpfError('CPF inválido');
                } else {
                    setCpfError('');
                }
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Novo Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nome Completo *</Label>
                                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF *</Label>
                                <Input
                                    id="cpf"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className={cpfError ? 'border-red-500' : ''}
                                    required
                                />
                                {cpfError && (
                                    <p className="text-sm text-red-600">{cpfError}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">WhatsApp *</Label>
                                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="address">Endereço Completo *</Label>
                                <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                                <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="notes">Observações</Label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate('/clients')}>Cancelar</Button>
                            <Button type="submit" className="bg-[#FF6B6B] hover:bg-[#FF5252]">Salvar Cliente</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
