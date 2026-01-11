import { Client, Item, Order, Supplier, AuditLog, User } from '@/types';
import { BUSINESS_RULES } from './constants';
import { generateCode } from './formatters';

const STORAGE_KEYS = {
    CLIENTS: 'cerejas_clients',
    ITEMS: 'cerejas_items',
    ORDERS: 'cerejas_orders',
    SUPPLIERS: 'cerejas_suppliers',
    AUDIT_LOGS: 'cerejas_audit_logs',
    USER: 'cerejas_users_db' // Changed to avoid conflict with auth session key 'cerejas_user'
};

// Helper to generate sequential codes (e.g., CAD-001, PED-001)
function generateSequentialCode(prefix: string, existingCodes: string[]): string {
    const numbers = existingCodes
        .map(code => {
            if (!code.startsWith(prefix)) return 0;
            const numPart = code.substring(prefix.length);
            return parseInt(numPart.replace(/\D/g, ''), 10) || 0;
        })
        .filter(n => !isNaN(n));

    const max = Math.max(0, ...numbers);
    const next = max + 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
}

// ==================== GENERIC STORAGE ====================

function getFromStorage<T>(key: string): T[] {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading ${key} from storage:`, error);
        return [];
    }
}

import { pushToFirestore } from './firestoreSync';

function saveToStorage<T>(key: string, data: T[]): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));

        // Fire and forget sync (don't await)
        pushToFirestore(key, data as any[]).catch(err =>
            console.error('Background Sync Error:', err)
        );

    } catch (error) {
        console.error(`Error saving ${key} to storage:`, error);
        throw new Error('Erro ao salvar dados');
    }
}

function createAuditLog(
    userId: string,
    userName: string,
    action: string,
    entityType: AuditLog['entity_type'],
    entityId: string,
    changes: Record<string, unknown>
): void {
    const logs = getFromStorage<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
    const newLog: AuditLog = {
        id: `audit-${Date.now()}`,
        user_id: userId,
        user_name: userName,
        action,
        entity_type: entityType,
        entity_id: entityId,
        changes,
        created_at: new Date().toISOString()
    };
    logs.push(newLog);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs);
}

// ==================== CLIENTS ====================

export const clientStorage = {
    getAll(): Client[] {
        return getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    },

    getById(id: string): Client | null {
        const clients = this.getAll();
        return clients.find(c => c.id === id) || null;
    },

    getByCPF(cpf: string): Client | null {
        const clients = this.getAll();
        const cleanCPF = cpf.replace(/\D/g, '');
        return clients.find(c => c.cpf.replace(/\D/g, '') === cleanCPF) || null;
    },

    create(data: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'total_spent'>, user: User): Client {
        // Check for duplicate CPF
        if (this.getByCPF(data.cpf)) {
            throw new Error('Já existe um cliente cadastrado com este CPF');
        }

        const clients = this.getAll();
        const newClient: Client = {
            ...data,
            id: generateCode(BUSINESS_RULES.CLIENT_CODE_PREFIX),
            total_spent: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        clients.push(newClient);
        saveToStorage(STORAGE_KEYS.CLIENTS, clients);

        createAuditLog(user.id, user.name, 'CREATE', 'CLIENT', newClient.id, newClient as unknown as Record<string, unknown>);

        return newClient;
    },

    update(id: string, data: Partial<Client>, user: User): Client {
        const clients = this.getAll();
        const index = clients.findIndex(c => c.id === id);

        if (index === -1) {
            throw new Error('Cliente não encontrado');
        }

        // Check CPF duplication if CPF is being changed
        if (data.cpf && data.cpf !== clients[index].cpf) {
            const existing = this.getByCPF(data.cpf);
            if (existing && existing.id !== id) {
                throw new Error('Já existe um cliente cadastrado com este CPF');
            }
        }

        const oldData = { ...clients[index] };
        clients[index] = {
            ...clients[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        saveToStorage(STORAGE_KEYS.CLIENTS, clients);
        createAuditLog(user.id, user.name, 'UPDATE', 'CLIENT', id, { old: oldData, new: clients[index] } as unknown as Record<string, unknown>);

        return clients[index];
    },

    delete(id: string, user: User): void {
        const clients = this.getAll();
        const filtered = clients.filter(c => c.id !== id);

        if (filtered.length === clients.length) {
            throw new Error('Cliente não encontrado');
        }

        saveToStorage(STORAGE_KEYS.CLIENTS, filtered);
        createAuditLog(user.id, user.name, 'DELETE', 'CLIENT', id, {});
    },

    search(query: string): Client[] {
        const clients = this.getAll();
        const lowerQuery = query.toLowerCase();

        return clients.filter(c =>
            c.full_name.toLowerCase().includes(lowerQuery) ||
            c.cpf.includes(query) ||
            c.phone.includes(query) ||
            c.email?.toLowerCase().includes(lowerQuery)
        );
    }
};

// ==================== ITEMS ====================

// ==================== HELPERS ====================

function isDateOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 <= e2 && s2 <= e1;
}

// ==================== ITEMS ====================

export const itemStorage = {
    getAll(): Item[] {
        return getFromStorage<Item>(STORAGE_KEYS.ITEMS);
    },

    getById(id: string): Item | null {
        const items = this.getAll();
        return items.find(i => i.id === id) || null;
    },

    getByCode(code: string): Item | null {
        const items = this.getAll();
        return items.find(i => i.code === code) || null;
    },

    getAvailability(itemId: string, startDate: string, endDate: string): number {
        const item = this.getById(itemId);
        if (!item) return 0;
        if (item.condition === 'DAMAGED') return 0;

        const allOrders = orderStorage.getAll();

        const conflictingOrders = allOrders.filter(order => {
            const isActive = order.status === 'CONFIRMED_PAID' || order.status === 'DELIVERED';
            if (!isActive) return false;

            const orderStart = order.pickup_date || '';
            const orderEnd = order.return_date || '';
            if (!orderStart || !orderEnd) return false;

            return isDateOverlap(startDate, endDate, orderStart, orderEnd);
        });

        let quantityUsed = 0;
        for (const order of conflictingOrders) {
            const orderItem = order.items.find(i => i.item_id === itemId);
            if (orderItem) {
                quantityUsed += orderItem.quantity;
            }
        }

        return Math.max(0, item.quantity_total - quantityUsed - (item.quantity_maintenance || 0));
    },

    getAvailable(startDate: string, endDate: string): Item[] {
        const allItems = this.getAll();
        return allItems.filter(item => {
            const availableQty = this.getAvailability(item.id, startDate, endDate);
            return availableQty > 0;
        });
    },


    create(data: Omit<Item, 'id' | 'code' | 'created_at' | 'updated_at'>, user: User): Item {
        const items = this.getAll();
        const existingCodes = items.map(i => i.code);
        const nextCode = generateSequentialCode('CAD-', existingCodes);

        const newItem: Item = {
            ...data,
            id: generateCode('ITEM-'), // Internal ID keeps using unique timestamp
            code: nextCode,            // User facing code uses sequential format
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        items.push(newItem);
        saveToStorage(STORAGE_KEYS.ITEMS, items);

        createAuditLog(user.id, user.name, 'CREATE', 'ITEM', newItem.id, newItem as unknown as Record<string, unknown>);

        return newItem;
    },

    update(id: string, data: Partial<Item>, user: User): Item {
        const items = this.getAll();
        const index = items.findIndex(i => i.id === id);

        if (index === -1) {
            throw new Error('Item não encontrado');
        }

        const oldData = { ...items[index] };
        items[index] = {
            ...items[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        saveToStorage(STORAGE_KEYS.ITEMS, items);
        createAuditLog(user.id, user.name, 'UPDATE', 'ITEM', id, { old: oldData, new: items[index] } as unknown as Record<string, unknown>);

        return items[index];
    },

    adjustQuantity(id: string, delta: number, user: User): Item {
        const item = this.getById(id);
        if (!item) throw new Error('Item não encontrado');

        const newTotal = item.quantity_total + delta;

        if (newTotal < 0) {
            throw new Error('Quantidade total não pode ser negativa');
        }

        return this.update(id, {
            quantity_total: newTotal
        }, user);
    },

    delete(id: string, user: User): void {
        const items = this.getAll();
        const item = this.getById(id);

        if (!item) {
            throw new Error('Item não encontrado');
        }

        // Check if item is being used in any active orders
        const orders = orderStorage.getAll();
        const activeOrders = orders.filter(order =>
            (order.status === 'CONFIRMED_PAID' || order.status === 'DELIVERED') &&
            order.items.some(i => i.item_id === id)
        );

        if (activeOrders.length > 0) {
            throw new Error(`Item não pode ser excluído pois está sendo usado em ${activeOrders.length} pedido(s) ativo(s)`);
        }

        const filtered = items.filter(i => i.id !== id);
        saveToStorage(STORAGE_KEYS.ITEMS, filtered);
        createAuditLog(user.id, user.name, 'DELETE', 'ITEM', id, {});
    }
};

// ==================== ORDERS ====================

export const orderStorage = {
    getAll(): Order[] {
        return getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    },

    getById(id: string): Order | null {
        const orders = this.getAll();
        return orders.find(o => o.id === id) || null;
    },

    getByClient(clientId: string): Order[] {
        const orders = this.getAll();
        return orders.filter(o => o.client_id === clientId);
    },

    create(data: Omit<Order, 'id' | 'code' | 'created_at' | 'updated_at'>, user: User): Order {
        if (!data.client_id) throw new Error('Cliente é obrigatório');
        if (!data.payment_method) throw new Error('Forma de pagamento é obrigatória');

        if (data.status === 'CONFIRMED_PAID' || data.status === 'DELIVERED') {
            if (!data.pickup_date || !data.return_date) {
                throw new Error('Datas de retirada e devolução são obrigatórias para confirmar pedido');
            }

            for (const item of data.items) {
                const available = itemStorage.getAvailability(item.item_id, data.pickup_date, data.return_date);
                if (available < item.quantity) {
                    throw new Error(`Estoque insuficiente para o item: ${item.item_name}. Disponível: ${available}`);
                }
            }
        }

        const orders = this.getAll();
        const newOrder: Order = {
            ...data,
            id: generateCode('ORD-'),
            code: generateSequentialCode('PED-', orderStorage.getAll().map(o => o.code)),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        orders.push(newOrder);
        saveToStorage(STORAGE_KEYS.ORDERS, orders);

        createAuditLog(user.id, user.name, 'CREATE', 'ORDER', newOrder.id, newOrder as unknown as Record<string, unknown>);

        return newOrder;
    },

    update(id: string, data: Partial<Order>, user: User): Order {
        const orders = this.getAll();
        const index = orders.findIndex(o => o.id === id);

        if (index === -1) {
            throw new Error('Pedido não encontrado');
        }

        const currentOrder = orders[index];
        const newStatus = data.status || currentOrder.status;

        const isBecomingActive = (newStatus === 'CONFIRMED_PAID' || newStatus === 'DELIVERED') &&
            (currentOrder.status !== 'CONFIRMED_PAID' && currentOrder.status !== 'DELIVERED');

        const isChangingParamsWhileActive = (currentOrder.status === 'CONFIRMED_PAID' || currentOrder.status === 'DELIVERED') &&
            (data.items || data.pickup_date || data.return_date);

        if (isBecomingActive || isChangingParamsWhileActive) {
            const pickup = data.pickup_date || currentOrder.pickup_date;
            const returnd = data.return_date || currentOrder.return_date;
            const itemsToCheck = data.items || currentOrder.items;

            if (!pickup || !returnd) {
                throw new Error('Datas são obrigatórias para pedidos confirmados');
            }

            for (const item of itemsToCheck) {
                let available = itemStorage.getAvailability(item.item_id, pickup, returnd);

                if (currentOrder.status === 'CONFIRMED_PAID' || currentOrder.status === 'DELIVERED') {
                    const currentItem = currentOrder.items.find(i => i.item_id === item.item_id);
                    if (currentItem) {
                        available += currentItem.quantity;
                    }
                }

                if (available < item.quantity) {
                    throw new Error(`Estoque insuficiente para ${item.item_name}. Disp: ${available}, Req: ${item.quantity}`);
                }
            }
        }

        const oldData = { ...orders[index] };
        orders[index] = {
            ...orders[index],
            ...data,
            updated_at: new Date().toISOString()
        };

        saveToStorage(STORAGE_KEYS.ORDERS, orders);
        createAuditLog(user.id, user.name, 'UPDATE', 'ORDER', id, { old: oldData, new: orders[index] } as unknown as Record<string, unknown>);

        return orders[index];
    },

    delete(id: string, user: User): void {
        const orders = this.getAll();
        const filtered = orders.filter(o => o.id !== id);
        saveToStorage(STORAGE_KEYS.ORDERS, filtered);
        createAuditLog(user.id, user.name, 'DELETE', 'ORDER', id, {});
    }
};

// ==================== SUPPLIERS ====================

export const supplierStorage = {
    getAll(): Supplier[] {
        return getFromStorage<Supplier>(STORAGE_KEYS.SUPPLIERS);
    },

    getById(id: string): Supplier | null {
        const suppliers = this.getAll();
        return suppliers.find(s => s.id === id) || null;
    },

    create(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>, user: User): Supplier {
        const suppliers = this.getAll();
        const newSupplier: Supplier = {
            ...data,
            id: `supplier-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        suppliers.push(newSupplier);
        saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);

        createAuditLog(user.id, user.name, 'CREATE', 'SUPPLIER', newSupplier.id, newSupplier as unknown as Record<string, unknown>);

        return newSupplier;
    },

    delete(id: string, user: User): void {
        const suppliers = this.getAll();
        const filtered = suppliers.filter(s => s.id !== id);
        saveToStorage(STORAGE_KEYS.SUPPLIERS, filtered);
        createAuditLog(user.id, user.name, 'DELETE', 'SUPPLIER', id, {});
    }
};

export const systemStorage = {
    clearCatalog(user: User): void {
        saveToStorage(STORAGE_KEYS.ITEMS, []);
        createAuditLog(user.id, user.name, 'DELETE_ALL', 'ITEM', 'ALL', {});
    },
    clearOrders(user: User): void {
        saveToStorage(STORAGE_KEYS.ORDERS, []);
        createAuditLog(user.id, user.name, 'DELETE_ALL', 'ORDER', 'ALL', {});
    }
};

// ==================== AUDIT LOGS ====================

export const auditStorage = {
    getAll(): AuditLog[] {
        return getFromStorage<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
    },

    getByEntity(entityType: AuditLog['entity_type'], entityId: string): AuditLog[] {
        const logs = this.getAll();
        return logs.filter(l => l.entity_type === entityType && l.entity_id === entityId);
    }
};

// ==================== USERS ====================

export const userStorage = {
    getAll(): User[] {
        return getFromStorage<User>(STORAGE_KEYS.USER);
    },

    getById(id: string): User | null {
        const users = this.getAll();
        return users.find(u => u.id === id) || null;
    },

    getByEmail(email: string): User | null {
        const users = this.getAll();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    create(data: Omit<User, 'id' | 'created_at'> & { password?: string }, adminUser: User): User {
        const users = this.getAll();

        if (this.getByEmail(data.email)) {
            throw new Error('Já existe um usuário com este e-mail');
        }

        const newUser = {
            ...data,
            id: `user-${Date.now()}`,
            created_at: new Date().toISOString()
        };

        users.push(newUser as User);
        saveToStorage(STORAGE_KEYS.USER, users);
        createAuditLog(adminUser.id, adminUser.name, 'CREATE', 'USER', newUser.id, { name: newUser.name, email: newUser.email, role: newUser.role });

        return newUser as User;
    },

    update(id: string, data: Partial<User> & { password?: string }, adminUser: User): User {
        const users = this.getAll();
        const index = users.findIndex(u => u.id === id);

        if (index === -1) throw new Error('Usuário não encontrado');

        const oldData = { ...users[index] };
        users[index] = { ...users[index], ...data };

        saveToStorage(STORAGE_KEYS.USER, users);
        createAuditLog(adminUser.id, adminUser.name, 'UPDATE', 'USER', id, { old: oldData, new: users[index] } as unknown as Record<string, unknown>);

        return users[index];
    },

    delete(id: string, adminUser: User): void {
        const users = this.getAll();
        // Prevent deleting yourself
        if (id === adminUser.id) {
            throw new Error('Você não pode excluir seu próprio usuário');
        }

        const filtered = users.filter(u => u.id !== id);
        saveToStorage(STORAGE_KEYS.USER, filtered);
        createAuditLog(adminUser.id, adminUser.name, 'DELETE', 'USER', id, {});
    },

    changePassword(userId: string, currentPassword: string, newPassword: string): boolean {
        const users = this.getAll();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('Usuário não encontrado');
        }

        const user = users[userIndex] as any;

        // Verify current password
        if (user.password !== currentPassword) {
            throw new Error('Senha atual incorreta');
        }

        // Validate new password
        if (!newPassword || newPassword.length < 4) {
            throw new Error('Nova senha deve ter no mínimo 4 caracteres');
        }

        // Update password
        user.password = newPassword;
        saveToStorage(STORAGE_KEYS.USER, users);
        createAuditLog(userId, user.name, 'UPDATE', 'USER', userId, { action: 'password_changed' });

        return true;
    },

    resetPassword(userId: string, newPassword: string, admin: User): boolean {
        if (admin.role !== 'admin') {
            throw new Error('Apenas administradores podem resetar senhas');
        }

        const users = this.getAll();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            throw new Error('Usuário não encontrado');
        }

        const user = users[userIndex] as any;

        // Validate new password
        if (!newPassword || newPassword.length < 4) {
            throw new Error('Nova senha deve ter no mínimo 4 caracteres');
        }

        // Update password
        user.password = newPassword;
        saveToStorage(STORAGE_KEYS.USER, users);
        createAuditLog(admin.id, admin.name, 'UPDATE', 'USER', userId, {
            action: 'password_reset_by_admin',
            target_user: user.email
        });

        return true;
    },

    validateLogin(email: string, password: string): User | null {
        // NOTE: In a real app complexity, we would hash passwords. 
        // For this local storage demo, we'll store basic fields. 
        // The previous mock didn't have passwords. 
        // We will match by email only if password matches (assuming we store 'password' in User type in a real DB, 
        // but User type might not have it. Let's assume for this requirements we extend User or just check email if no password field)

        const users = this.getAll();

        // FAILSAFE: If the default admin exists but has no password (due to previous bug), update it.
        const adminIndex = users.findIndex(u => u.id === 'admin-init');
        if (adminIndex !== -1 && !(users[adminIndex] as any).password) {
            console.log('Fixing broken user admin...');
            (users[adminIndex] as any).password = 'admin';
            saveToStorage(STORAGE_KEYS.USER, users);
        }

        // Fallback for initial admin if empty
        if (users.length === 0 && email === 'admin@cerejas.com' && password === 'admin') {
            const admin = {
                id: 'admin-init',
                name: 'Administrador',
                email: 'admin@cerejas.com',
                role: 'admin' as const,
                created_at: new Date().toISOString(),
                password: 'admin'
            };
            // Manually save directly to avoid circular check in Create
            users.push(admin as any);
            saveToStorage(STORAGE_KEYS.USER, users);
            return admin as User;
        }

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        // Simple password check (store password on user object? The User type interface usually doesn't expose password to frontend)
        // We need to check if 'User' type has password. If not, we might need to handle it differently or extend it locally.
        // For this exercise, I'll cheat slightly and check if the found user has a 'password' property even if TS complains, or add it to type.
        // Let's assume for now we trust the user object has it or we just check email for the demo if 'password' isn't in type.
        // Actually, the requirement asks for "Name, Email, Password, Role". So I should add password to the storage but maybe not return it in User type.

        if (user && (user as any).password === password) {
            // Remove password from returned object
            const { password: _, ...safeUser } = (user as any);
            return safeUser as User;
        }

        return null;
    }
};

