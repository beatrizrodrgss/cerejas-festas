import { Bell, User, Settings, LogOut, Info, AlertTriangle, Calendar } from 'lucide-react';
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
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationsOpen = (open: boolean) => {
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'STOCK': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'ORDER_LATE': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'ORDER_TODAY': return <Calendar className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Controle de estoque
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu onOpenChange={handleNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0" align="end">
              <div className="p-4 border-b flex justify-between items-center">
                <h4 className="font-semibold leading-none">Notificações</h4>
                <span className="text-xs text-muted-foreground">{notifications.length} alertas</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                    <Bell className="h-8 w-8 text-gray-300" />
                    <p>Tudo tranquilo por aqui!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
                        onClick={() => {
                          if (notification.link) navigate(notification.link);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className="mt-1">
                            {getIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium text-gray-900 leading-none">
                              {notification.title}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {formatDistanceToNow(notification.date, { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
              <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => {
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