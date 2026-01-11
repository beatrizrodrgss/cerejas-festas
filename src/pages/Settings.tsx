import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Shield, UserPlus, Trash2, Cloud, ChevronDown, ChevronUp } from 'lucide-react';
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
import { pushToFirestore, pullFromFirestore } from '@/lib/firestoreSync';
import { User as UserType } from '@/types';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const [users, setUsers] = useState<UserType[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);

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

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const currentPassword = formData.get('currentPassword') as string;
              const newPassword = formData.get('newPassword') as string;
              const confirmPassword = formData.get('confirmPassword') as string;

              if (newPassword !== confirmPassword) {
                toast.error('As senhas não coincidem');
                return;
              }

              try {
                userStorage.changePassword(user.id, currentPassword, newPassword);
                toast.success('Senha alterada com sucesso!');
                e.currentTarget.reset();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha');
              }
            }} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    minLength={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-sm">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm">Confirmar</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={4}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button type="submit" size="sm">
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Personalize as cores e o modo do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo Escuro</Label>
                <p className="text-sm text-gray-500">Alternar entre modo claro e escuro</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isDarkMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleDarkMode}
                  className={isDarkMode ? "bg-slate-900" : ""}
                >
                  {isDarkMode ? 'Ativado' : 'Desativado'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Tema de Cores</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Button
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 ${theme === 'cherry' ? 'border-primary border-2 bg-primary/5' : ''}`}
                  onClick={() => setTheme('cherry')}
                >
                  <div className="w-8 h-8 rounded-full bg-[#E11D48] shadow-sm"></div>
                  <span className="font-medium">Vermelho</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 ${theme === 'blue' ? 'border-blue-600 border-2 bg-blue-50' : ''}`}
                  onClick={() => setTheme('blue')}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 shadow-sm"></div>
                  <span className="font-medium">Azul</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 ${theme === 'green' ? 'border-green-600 border-2 bg-green-50' : ''}`}
                  onClick={() => setTheme('green')}
                >
                  <div className="w-8 h-8 rounded-full bg-green-600 shadow-sm"></div>
                  <span className="font-medium">Verde</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 ${theme === 'purple' ? 'border-purple-600 border-2 bg-purple-50' : ''}`}
                  onClick={() => setTheme('purple')}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-600 shadow-sm"></div>
                  <span className="font-medium">Roxo</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 ${theme === 'orange' ? 'border-orange-600 border-2 bg-orange-50' : ''}`}
                  onClick={() => setTheme('orange')}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-600 shadow-sm"></div>
                  <span className="font-medium">Laranja</span>
                </Button>
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
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-700 dark:text-blue-300 font-bold">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                      {u.id !== user.id && (
                        <>
                          <Dialog open={resetPasswordUserId === u.id} onOpenChange={(open) => setResetPasswordUserId(open ? u.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Resetar Senha
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Resetar Senha de {u.name}</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const newPassword = formData.get('newPassword') as string;
                                const confirmPassword = formData.get('confirmPassword') as string;

                                if (newPassword !== confirmPassword) {
                                  toast.error('As senhas não coincidem');
                                  return;
                                }

                                try {
                                  // Preserve admin session before reset
                                  const currentAdminSession = localStorage.getItem('cerejas_user');

                                  // Reset the user's password
                                  userStorage.resetPassword(u.id, newPassword, user);

                                  // Restore admin session (in case it was affected)
                                  if (currentAdminSession) {
                                    localStorage.setItem('cerejas_user', currentAdminSession);
                                  }

                                  toast.success(`Senha de ${u.name} alterada com sucesso!`);

                                  // Close dialog by setting state to null
                                  setResetPasswordUserId(null);
                                  e.currentTarget.reset();
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : 'Erro ao resetar senha');
                                }
                              }} className="space-y-4">
                                <div>
                                  <Label htmlFor={`newPassword-${u.id}`}>Nova Senha</Label>
                                  <Input
                                    id={`newPassword-${u.id}`}
                                    name="newPassword"
                                    type="password"
                                    required
                                    minLength={4}
                                    placeholder="Mínimo 4 caracteres"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`confirmPassword-${u.id}`}>Confirmar Senha</Label>
                                  <Input
                                    id={`confirmPassword-${u.id}`}
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    minLength={4}
                                    placeholder="Repita a senha"
                                  />
                                </div>
                                <Button type="submit" className="w-full">
                                  Confirmar Reset
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p className="text-center text-gray-500">Nenhum usuário encontrado (além de você).</p>}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Advanced Options Toggle */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <h3 className="text-lg font-medium text-gray-900">Opções Avançadas</h3>
            <p className="text-sm text-gray-500">Gerenciamento de dados, backup e zona de perigo</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <>Running "Ocultar" <ChevronUp className="ml-2 h-4 w-4" /></>
            ) : (
              <>Mostrar <ChevronDown className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>

        {showAdvanced && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Cloud Sync */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  Nuvem e Sincronização (Firebase)
                  {syncStatus === 'syncing' && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>}
                  {syncStatus === 'success' && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                  {syncStatus === 'error' && <div className="h-2 w-2 rounded-full bg-red-500"></div>}
                </CardTitle>
                <CardDescription className="text-green-600">Gerenciar conexão com o banco de dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Panel */}
                <div className="p-4 bg-white/50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Status da Conexão</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${syncStatus === 'success' ? 'bg-green-100 text-green-700' :
                      syncStatus === 'error' ? 'bg-red-100 text-red-700' :
                        syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {syncStatus === 'success' ? '✓ Conectado' :
                        syncStatus === 'error' ? '✗ Erro de Conexão' :
                          syncStatus === 'syncing' ? '⟳ Sincronizando...' :
                            '○ Aguardando'}
                    </span>
                  </div>
                  {lastSyncTime && (
                    <p className="text-xs text-green-600">Última sincronização: {lastSyncTime}</p>
                  )}
                  {syncStatus === 'error' && (
                    <div className="mt-2 text-xs text-red-600 space-y-1">
                      <p>⚠️ Verifique o console do navegador (F12) para detalhes</p>
                      <p>🔒 Se aparecer "PERMISSION DENIED", configure as regras:</p>
                      <a
                        href="https://console.firebase.google.com/project/cerejas-festas/firestore/rules"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline block"
                      >
                        → Abrir Firebase Console
                      </a>
                    </div>
                  )}
                </div>

                {/* Test Connection */}
                <div className="flex items-center justify-between p-4 bg-white rounded border border-green-100">
                  <div>
                    <h4 className="font-medium text-green-900">Testar Conexão</h4>
                    <p className="text-sm text-green-700">Verifica se o Firebase está acessível</p>
                  </div>
                  <Button
                    onClick={async () => {
                      setSyncStatus('syncing');
                      try {
                        await pullFromFirestore();
                        setSyncStatus('success');
                        setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
                        toast.success('Conexão OK! Dados sincronizados.');
                      } catch (error: any) {
                        setSyncStatus('error');
                        toast.error('Falha na conexão. Veja o console (F12).');
                        console.error('Test connection failed:', error);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={syncStatus === 'syncing'}
                  >
                    <Cloud className="w-4 h-4 mr-2" />
                    {syncStatus === 'syncing' ? 'Testando...' : 'Testar'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded border border-green-100">
                  <div>
                    <h4 className="font-medium text-green-900">Forçar Sincronização</h4>
                    <p className="text-sm text-green-700">Envia todos os dados locais para a nuvem agora.</p>
                  </div>
                  <Button onClick={async () => {
                    const toastId = toast.loading('Enviando dados para a nuvem...');
                    try {
                      const keys = ['cerejas_items', 'cerejas_clients', 'cerejas_orders', 'cerejas_suppliers', 'cerejas_users_db'];
                      let count = 0;
                      for (const key of keys) {
                        const data = JSON.parse(localStorage.getItem(key) || '[]');
                        if (data.length > 0) {
                          await pushToFirestore(key, data);
                          count += data.length;
                        }
                      }
                      toast.success(`Sucesso! ${count} registros sincronizados.`, { id: toastId });
                    } catch (error) {
                      console.error(error);
                      toast.error('Erro ao sincronizar. Verifique a conexão.', { id: toastId });
                    }
                  }} className="bg-green-600 hover:bg-green-700 text-white">
                    <Cloud className="w-4 h-4 mr-2" />
                    Sincronizar Agora
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-700">Backup e Restauração</CardTitle>
                <CardDescription className="text-blue-600">Salve seus dados em um arquivo seguro</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded border border-blue-100">
                  <div>
                    <h4 className="font-medium text-blue-900">Exportar Dados</h4>
                    <p className="text-sm text-blue-700">Baixe um arquivo Backup com todos os seus registros.</p>
                  </div>
                  <Button onClick={() => {
                    const data: Record<string, any> = {};
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key && key.startsWith('cerejas_')) {
                        data[key] = JSON.parse(localStorage.getItem(key) || 'null');
                      }
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup_cerejas_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Backup baixado com sucesso!');
                  }}>
                    <User className="w-4 h-4 mr-2" />
                    Baixar Backup
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded border border-blue-100">
                  <div>
                    <h4 className="font-medium text-blue-900">Restaurar Dados</h4>
                    <p className="text-sm text-blue-700">Recupere dados de um arquivo Backup.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="backup-upload"
                      className="hidden"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (!window.confirm('ATENÇÃO: Isso irá substituir TODOS os dados atuais pelos do arquivo. Deseja continuar?')) {
                          e.target.value = '';
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const json = JSON.parse(event.target?.result as string);
                            // Validate basic structure
                            if (typeof json !== 'object') throw new Error('Arquivo inválido');

                            // Clear current app data
                            const keysToRemove = [];
                            for (let i = 0; i < localStorage.length; i++) {
                              const key = localStorage.key(i);
                              if (key && key.startsWith('cerejas_')) {
                                keysToRemove.push(key);
                              }
                            }
                            keysToRemove.forEach(k => localStorage.removeItem(k));

                            // Restore data
                            Object.keys(json).forEach(key => {
                              if (key.startsWith('cerejas_')) {
                                localStorage.setItem(key, JSON.stringify(json[key]));
                              }
                            });

                            toast.success('Dados restaurados! Recarregando...');
                            setTimeout(() => window.location.reload(), 1500);
                          } catch (err) {
                            toast.error('O arquivo de backup é inválido ou está corrompido.');
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                    <Button variant="outline" onClick={() => document.getElementById('backup-upload')?.click()}>
                      Upload Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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
        )}
      </div>
    </div>
  );
}