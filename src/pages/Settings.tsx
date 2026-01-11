import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Shield, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userStorage } from '@/lib/storage';
import { User as UserType } from '@/types';

export default function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });

  useEffect(() => {
    loadUsers();
  }, [isAddUserOpen]); // Reload when dialog closes/changes

  const loadUsers = () => {
    setUsers(userStorage.getAll());
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      userStorage.create(newUser, user);
      toast.success('Usuário criado com sucesso!');
      setIsAddUserOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      userStorage.delete(userId, user);
      toast.success('Usuário excluído!');
      loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir');
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gray-100 rounded-full">
          <User className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600">Gerencie seu perfil e preferências do sistema</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>Suas informações de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={user.name} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user.email} readOnly className="bg-gray-50" />
              </div>
              <div>
                <Label>Função</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gerenciamento de Usuários (Apenas Admin) */}
        {user.role === 'admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>Adicione e remova usuários do sistema</CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        required
                        value={newUser.name}
                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        required
                        value={newUser.email}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Senha</Label>
                      <Input
                        type="password"
                        required
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Função</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(v: 'admin' | 'user') => setNewUser({ ...newUser, role: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário Comum</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">Criar Usuário</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-bold">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                      {u.id !== user.id && (
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-center text-gray-500">Nenhum usuário encontrado (além de você).</p>}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Zona de Perigo</CardTitle>
            <CardDescription className="text-red-600">Ações irreversíveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded border border-red-100">
              <div>
                <h4 className="font-medium text-red-900">Limpar Catálogo</h4>
                <p className="text-sm text-red-700">Exclui todos os itens cadastrados no sistema.</p>
              </div>
              <Button variant="destructive" onClick={() => {
                if (window.confirm('Tem certeza absoluta? Isso apagará TODOS os itens!')) {
                  if (window.confirm('Realmente deseja prosseguir?')) {
                    import('@/lib/storage').then(({ systemStorage }) => {
                      if (user) systemStorage.clearCatalog(user);
                      toast.success('Catálogo limpo com sucesso!');
                    });
                  }
                }
              }}>Limpar Tudo</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}