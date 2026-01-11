import { ClientStatus, ItemCategory, PartyType, PaymentMethod, ItemLocation, ItemCondition } from '@/types';

export const CLIENT_STATUSES = [
    { value: ClientStatus.ACTIVE, label: 'Ativo', color: 'green' },
    { value: ClientStatus.DEFAULTER, label: 'Inadimplente', color: 'orange' },
    { value: ClientStatus.BLOCKED, label: 'Bloqueado', color: 'red' }
];

export const ITEM_CATEGORIES = [
    { value: ItemCategory.LOUÇAS, label: 'Louças' },
    { value: ItemCategory.ITENS_MESA, label: 'Itens de Mesa' },
    { value: ItemCategory.PAINEIS, label: 'Painéis' },
    { value: ItemCategory.MOVEIS, label: 'Móveis' },
    { value: ItemCategory.TECIDO_SUBLIMATICO, label: 'Tecido Sublimático' },
    { value: ItemCategory.TECIDO_COR_SOLIDA, label: 'Tecido Cor Sólida' },
    { value: ItemCategory.LONAS, label: 'Lonas' },
    { value: ItemCategory.TAPETE_TECIDO, label: 'Tapete Tecido' },
    { value: ItemCategory.TAPETE_LONA, label: 'Tapete Lona' },
    { value: ItemCategory.DISPLAY, label: 'Display' },
    { value: ItemCategory.FOLHAGEM, label: 'Folhagem' },
    { value: ItemCategory.ILUMINACAO, label: 'Iluminação' }
];

export const QUANTITY_OPTIONS = Array.from({ length: 200 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString()
}));

export const PARTY_TYPES = [
    { value: PartyType.MINIZINHA, label: 'Minizinha' },
    { value: PartyType.POCKET, label: 'Pocket' },
    { value: PartyType.BRONZE, label: 'Bronze' },
    { value: PartyType.PEGUE_MONTE, label: 'Pegue e Monte' },
    { value: PartyType.FESTA_MESA_LOCAL, label: 'Festa Mesa Local' }
];

export const PAYMENT_METHODS = [
    { value: PaymentMethod.PIX, label: 'PIX' },
    { value: PaymentMethod.CREDIT, label: 'Crédito' },
    { value: PaymentMethod.DEBIT, label: 'Débito' },
    { value: PaymentMethod.CASH, label: 'Espécie' }
];

export const ITEM_LOCATIONS = [
    { value: ItemLocation.STOCK, label: 'Estoque' },
    { value: ItemLocation.IN_PARTY, label: 'Em Festa' },
    { value: ItemLocation.MAINTENANCE, label: 'Em Manutenção' }
];

export const ITEM_CONDITIONS = [
    { value: ItemCondition.NORMAL, label: 'Normal', color: 'green' },
    { value: ItemCondition.DAMAGED, label: 'Danificado', color: 'red' }
];

// Business Rules
export const BUSINESS_RULES = {
    MAX_ITEM_DESCRIPTION_LENGTH: 200,
    MAX_ITEM_QUANTITY: 200,
    ITEM_CODE_PREFIX: 'ITEM-',
    ORDER_CODE_PREFIX: 'PED-',
    CLIENT_CODE_PREFIX: 'CLI-'
};
