import { Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { auditStorage } from '@/lib/storage';
import { AuditLog } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AuditLog[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Poll for notifications every 30s or on mount
    const loadNotifications = () => {
      const allLogs = auditStorage.getAll();
      // Filter logs from last 24h
      const recent = allLogs.filter(log => {
        const logDate = new Date(log.created_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return logDate > oneDayAgo;
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(recent);
      // Logic for unread could be stored in local storage "lastReadTime"
      const lastRead = localStorage.getItem('notifications_last_read');
      if (recent.length > 0) {
        if (!lastRead || new Date(recent[0].created_at).getTime() > new Date(lastRead).getTime()) {
          setHasUnread(true);
        }
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationsOpen = (open: boolean) => {
    if (open && notifications.length > 0) {
      setHasUnread(false);
      localStorage.setItem('notifications_last_read', new Date().toISOString());
    }
  };

  const formatAction = (log: AuditLog) => {
    switch (log.action) {
      case 'CREATE': return 'criou';
      case 'UPDATE': return 'atualizou';
      case 'DELETE': return 'excluiu';
      case 'DELETE_ALL': return 'limpou tudo em';
      default: return log.action;
    }
  };

  const formatEntity = (type: string) => {
    switch (type) {
      case 'ITEM': return 'item';
      case 'ORDER': return 'pedido';
      case 'CLIENT': return 'cliente';
      case 'SUPPLIER': return 'fornecedor';
      case 'USER': return 'usuário';
      default: return type;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Sistema Cérebro Cerejas
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu onOpenChange={handleNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {hasUnread && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h4 className="font-semibold leading-none">Notificações Recentes</h4>
                <p className="text-xs text-muted-foreground mt-1">Últimas 24 horas</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Nenhuma notificação.</div>
                ) : (
                  <div className="divide-y">
                    {notifications.map(log => (
                      <div key={log.id} className="p-3 text-sm hover:bg-gray-50">
                        <p>
                          <span className="font-medium">{log.user_name}</span> {formatAction(log)} um(a) {formatEntity(log.entity_type)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => {
                logout();
                navigate('/login');
              }}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}