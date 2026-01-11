
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
        birthDate: '',
        notes: '',
        // Address Breakdown
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: ''
    });

    const handleCepBlur = async () => {
        const cleanCep = formData.cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast.error('CEP não encontrado');
                return;
            }

            setFormData(prev => ({
                ...prev,
                street: data.logradouro,
                neighborhood: data.bairro,
                city: data.localidade,
                state: data.uf
            }));
        } catch (error) {
            toast.error('Erro ao buscar CEP');
        }
    };

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

            // Construct full address
            const finalAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.cep}`;

            clientStorage.create({
                full_name: formData.full_name,
                cpf: formData.cpf.replace(/\D/g, ''),
                phone: formData.phone,
                email: formData.email || undefined,
                address: finalAddress,
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
            const formatted = formatCPF(value);
            setFormData({ ...formData, cpf: formatted });
            if (cpfError) setCpfError('');
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length === 11) {
                if (!validateCPF(digitsOnly)) {
                    setCpfError('CPF inválido');
                } else {
                    setCpfError('');
                }
            }
        } else if (name === 'cep') {
            // Mask CEP 00000-000
            const v = value.replace(/\D/g, '').slice(0, 8);
            const formatted = v.replace(/^(\d{5})(\d)/, '$1-$2');
            setFormData({ ...formData, cep: formatted });
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

                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                                <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-semibold mb-3">Endereço</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cep">CEP *</Label>
                                    <Input
                                        id="cep"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleChange}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="street">Rua/Logradouro *</Label>
                                    <Input id="street" name="street" value={formData.street} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="number">Número *</Label>
                                    <Input id="number" name="number" value={formData.number} onChange={handleChange} required />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="complement">Complemento</Label>
                                    <Input id="complement" name="complement" value={formData.complement} onChange={handleChange} placeholder="Apto, Bloco, etc." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="neighborhood">Bairro *</Label>
                                    <Input id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade *</Label>
                                    <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado (UF) *</Label>
                                    <Input id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} required />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-2">
                            <div className="col-span-1 space-y-2">
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
                            <Button type="submit" className="bg-primary hover:bg-primary/90">Salvar Cliente</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
