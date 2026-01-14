// ==================== ENUMS ====================

export enum ClientStatus {
    ACTIVE = 'ACTIVE',
    DEFAULTER = 'DEFAULTER',
    BLOCKED = 'BLOCKED'
}

export enum ItemStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    OUT = 'OUT',
    IN_EVENT = 'IN_EVENT',
    MAINTENANCE = 'MAINTENANCE',
    LOST = 'LOST'
}

export enum ItemLocation {
    STOCK = 'STOCK',
    IN_PARTY = 'IN_PARTY',
    MAINTENANCE = 'MAINTENANCE'
}

export enum ItemCondition {
    NORMAL = 'NORMAL',
    DAMAGED = 'DAMAGED'
}

export enum ItemCategory {
    LOUÇAS = 'LOUÇAS',
    ITENS_MESA = 'ITENS_MESA',
    PAINEIS = 'PAINEIS',
    MOVEIS = 'MOVEIS',
    TECIDO_SUBLIMATICO = 'TECIDO_SUBLIMATICO',
    TECIDO_COR_SOLIDA = 'TECIDO_COR_SOLIDA',
    LONAS = 'LONAS',
    TAPETE_TECIDO = 'TAPETE_TECIDO',
    TAPETE_LONA = 'TAPETE_LONA',
    DISPLAY = 'DISPLAY',
    FOLHAGEM = 'FOLHAGEM',
    ILUMINACAO = 'ILUMINACAO'
}

export enum PartyType {
    MINIZINHA = 'MINIZINHA',
    POCKET = 'POCKET',
    BRONZE = 'BRONZE',
    PEGUE_MONTE = 'PEGUE_MONTE',
    FESTA_MESA_LOCAL = 'FESTA_MESA_LOCAL'
}

export enum OrderStatus {
    QUOTE = 'QUOTE',                 // Em orçamento
    CONFIRMED_PAID = 'CONFIRMED_PAID', // Confirmado - pago
    DELIVERED = 'DELIVERED',          // Entregue
    RETURNED = 'RETURNED'             // Devolvido
}

export enum PaymentMethod {
    PIX = 'PIX',
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT',
    CASH = 'CASH'
}

// ==================== INTERFACES ====================

export interface Client {
    id: string;
    full_name: string;
    cpf: string;
    phone: string;
    email?: string;
    address: string;
    birth_date: string;
    status: ClientStatus;
    notes?: string;
    total_spent: number;
    created_at: string;
    updated_at: string;
}

export interface ClientHistory {
    client_id: string;
    orders: Order[];
    total_orders: number;
    total_spent: number;
}

export interface Item {
    id: string;
    code: string;
    name: string;
    category: ItemCategory;
    description?: string;
    quantity_total: number;
    quantity_available: number;
    quantity_rented: number;
    location: ItemLocation;
    condition: ItemCondition;
    damage_description?: string;
    damage_photo?: string;
    rental_value: number;
    replacement_value: number;
    dimensions?: string;
    material?: string;
    photos: string[];
    supplier_id?: string;
    created_by: string;
    created_at: string;
    quantity_maintenance: number;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    item_id: string;
    item_code: string;
    item_name: string;
    quantity: number;
    unit_value: number;
    replacement_value?: number;
    total_value: number;
}

export interface Order {
    id: string;
    code: string;
    client_id: string;
    client_name: string;
    party_type: PartyType;

    // Logistics dates
    pickup_date?: string;
    pickup_time?: string;
    return_date?: string;
    return_time?: string;

    // Assembly dates (for events with team assembly)
    assembly_date?: string;
    assembly_time?: string;
    disassembly_date?: string;
    disassembly_time?: string;

    items: OrderItem[];
    total_value: number;

    // Payment
    payment_method: PaymentMethod;
    amount_paid: number;
    amount_pending: number;
    installments?: number;

    status: OrderStatus;

    // Gallery
    inspiration_photos: string[];
    assembly_photos: string[];

    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface Supplier {
    id: string;
    name: string;
    cpf_cnpj: string;
    contact: string;
    products_supplied: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface SupplierPurchase {
    id: string;
    supplier_id: string;
    item_id: string;
    purchase_value: number;
    purchase_date: string;
    notes?: string;
}

export interface AuditLog {
    id: string;
    user_id: string;
    user_name: string;
    action: string;
    entity_type: 'CLIENT' | 'ITEM' | 'ORDER' | 'SUPPLIER' | 'USER';
    entity_id: string;
    changes: Record<string, unknown>;
    created_at: string;
}

export interface FinancialReport {
    period_start: string;
    period_end: string;
    total_revenue: number;
    paid_orders: number;
    pending_orders: number;
    damage_losses: number;
    replacement_costs: number;
    by_party_type: Record<PartyType, number>;
    by_payment_method: Record<PaymentMethod, number>;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'operator' | 'viewer' | 'user';
    created_at: string;
}
