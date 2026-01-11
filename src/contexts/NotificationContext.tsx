import React, { createContext, useContext, useState, useEffect } from 'react';
import { itemStorage, orderStorage } from '@/lib/storage';
import { Item, Order } from '@/types';
import { differenceInDays, isBefore, parseISO, startOfDay } from 'date-fns';

export type NotificationType = 'STOCK' | 'ORDER_LATE' | 'ORDER_TODAY' | 'ORDER_RETURN';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    date: Date;
    read: boolean;
    link?: string;
}

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    checkNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const checkNotifications = () => {
        const newNotifications: AppNotification[] = [];
        const today = startOfDay(new Date());

        // 1. Check Low Stock Items (< 20% available)
        // We check total quantity vs maintenance for a simple heuristic, 
        // or actually query availability for "today".
        // Let's check permanent stock issues (Total - Maintenance < Threshold)
        const items = itemStorage.getAll();
        items.forEach(item => {
            const availableTotal = item.quantity_total - (item.quantity_maintenance || 0);
            const ratio = availableTotal / (item.quantity_total || 1);

            if (item.quantity_total > 0 && ratio <= 0.2) {
                newNotifications.push({
                    id: `stock-${item.id}`,
                    type: 'STOCK',
                    title: 'Estoque Baixo',
                    message: `O item "${item.name}" está com apenas ${availableTotal} unidades disponíveis.`,
                    date: new Date(),
                    read: false,
                    link: '/catalog'
                });
            }
        });

        // 2. Check Pending Orders (Late or Due Today)
        const orders = orderStorage.getAll();
        const activeOrders = orders.filter(o => o.status === 'CONFIRMED_PAID' || o.status === 'DELIVERED');

        activeOrders.forEach(order => {
            if (!order.return_date) return;
            const returnDate = parseISO(order.return_date);
            const startReturn = startOfDay(returnDate);

            // Late returns
            if (isBefore(startReturn, today)) {
                newNotifications.push({
                    id: `late-${order.id}`,
                    type: 'ORDER_LATE',
                    title: 'Devolução Atrasada',
                    message: `O pedido ${order.code} (Cliente: ${order.client_name}) deveria ter sido devolvido em ${order.return_date}.`,
                    date: returnDate,
                    read: false,
                    link: '/orders'
                });
            }
            // Due today
            else if (differenceInDays(startReturn, today) === 0) {
                newNotifications.push({
                    id: `today-${order.id}`,
                    type: 'ORDER_TODAY',
                    title: 'Devolução Hoje',
                    message: `O pedido ${order.code} deve ser devolvido hoje.`,
                    date: returnDate,
                    read: false,
                    link: '/orders'
                });
            }
        });

        // Merge with read state from localStorage
        const readIds = JSON.parse(localStorage.getItem('cerejas_notifications_read') || '[]');

        const processed = newNotifications.map(n => ({
            ...n,
            read: readIds.includes(n.id)
        })).sort((a, b) => b.date.getTime() - a.date.getTime());

        setNotifications(processed);
    };

    // Initial check and interval
    useEffect(() => {
        checkNotifications();
        const interval = setInterval(checkNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        const readIds = JSON.parse(localStorage.getItem('cerejas_notifications_read') || '[]');
        if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem('cerejas_notifications_read', JSON.stringify(readIds));
        }
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        const allIds = notifications.map(n => n.id);
        const currentRead = JSON.parse(localStorage.getItem('cerejas_notifications_read') || '[]');
        const uniqueReads = Array.from(new Set([...currentRead, ...allIds]));
        localStorage.setItem('cerejas_notifications_read', JSON.stringify(uniqueReads));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, checkNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
}
