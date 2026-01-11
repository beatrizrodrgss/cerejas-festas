
import { itemStorage, orderStorage } from './lib/storage';
import { ItemCategory, ItemCondition, ItemLocation, PartyType, PaymentMethod, OrderStatus } from './types';

// MOCK LocalStorage
const mockStore: Record<string, string> = {};
global.localStorage = {
    getItem: (key: string) => mockStore[key] || null,
    setItem: (key: string, value: string) => { mockStore[key] = value; },
    length: 0,
    clear: () => { },
    key: () => null,
    removeItem: () => { }
};

// USER MOCK
const adminUser = {
    id: 'admin-1',
    name: 'Admin Tester',
    email: 'admin@test.com',
    role: 'admin' as const,
    created_at: new Date().toISOString()
};

async function runTests() {
    console.log('🧪 Starting Logic Tests for Cérebro Cerejas...\n');

    try {
        // 1. Create Item
        console.log('Step 1: Creating Item (Total Qty: 10)...');
        const item = itemStorage.create({
            name: 'Cadeira Tiffany Dourada',
            category: ItemCategory.MOVEIS,
            quantity_total: 10,
            quantity_available: 10, // Legacy field, ignored by new logic
            quantity_rented: 0,
            location: ItemLocation.STOCK,
            condition: ItemCondition.NORMAL,
            rental_value: 15,
            replacement_value: 150,
            photos: [],
            created_by: adminUser.id,
            quantity_maintenance: 0
        }, adminUser);
        console.log(`✅ Item Created: ${item.name} (${item.id})`);

        // 2. Check Availability (Should be 10)
        const initAvail = itemStorage.getAvailability(item.id, '2024-01-01', '2024-01-05');
        console.log(`Step 2: Initial Availability (Jan 1-5): ${initAvail}`);
        if (initAvail !== 10) throw new Error(`Expected 10, got ${initAvail}`);

        // 3. Create Order A (Jan 01 - Jan 03, Qty 4)
        console.log('\nStep 3: Creating Order A (Jan 1-3, Qty: 4)...');
        orderStorage.create({
            client_id: 'cli-1',
            client_name: 'Maria Teste',
            party_type: PartyType.BRONZE,
            pickup_date: '2024-01-01',
            return_date: '2024-01-03',
            items: [{
                id: '1', item_id: item.id, item_code: item.code, item_name: item.name,
                quantity: 4, unit_value: 15, total_value: 60, order_id: ''
            }],
            total_value: 60,
            payment_method: PaymentMethod.PIX,
            amount_paid: 60,
            amount_pending: 0,
            status: OrderStatus.CONFIRMED_PAID,
            inspiration_photos: [],
            assembly_photos: [],
            created_by: adminUser.id
        }, adminUser);
        console.log('✅ Order A Created');

        // 4. Check Availability again (Should be 6 for Jan 1-3)
        const midAvail = itemStorage.getAvailability(item.id, '2024-01-02', '2024-01-02');
        console.log(`Step 4: Availability during Order A (Jan 2): ${midAvail}`);
        if (midAvail !== 6) throw new Error(`Expected 6, got ${midAvail}`);

        // 5. Check Availability for NON-overlapping dates (Jan 5-6) (Should be 10)
        const futureAvail = itemStorage.getAvailability(item.id, '2024-01-05', '2024-01-06');
        console.log(`Step 5: Availability after Order A (Jan 5-6): ${futureAvail}`);
        if (futureAvail !== 10) throw new Error(`Expected 10, got ${futureAvail}`);

        // 6. Try to Overbook (Create Order B for Jan 2-4, Qty 7) -> Should FAIL (Only 6 available)
        console.log('\nStep 6: Attempting Overbooking (Jan 2-4, Qty: 7)...');
        try {
            orderStorage.create({
                client_id: 'cli-2',
                client_name: 'João Fail',
                party_type: PartyType.BRONZE,
                pickup_date: '2024-01-02',
                return_date: '2024-01-04',
                items: [{
                    id: '2', item_id: item.id, item_code: item.code, item_name: item.name,
                    quantity: 7, unit_value: 15, total_value: 105, order_id: ''
                }],
                total_value: 105,
                payment_method: PaymentMethod.PIX,
                amount_paid: 105,
                amount_pending: 0,
                status: OrderStatus.CONFIRMED_PAID, // Trying to confirm immediately
                inspiration_photos: [],

                assembly_photos: [],
                created_by: adminUser.id
            }, adminUser);
            throw new Error('❌ FAILED: Overbooking was allowed!');
        } catch (e) {
            if (e instanceof Error) {
                if (e.message.includes('Estoque insuficiente')) {
                    console.log(`✅ SUCCESS: Overbooking blocked correctly! Error: "${e.message}"`);
                } else {
                    throw e;
                }
            }
        }

        console.log('\n🎉 ALL LOGIC TESTS PASSED!');

    } catch (e) {
        console.error('\n❌ TEST FAILED:', e);
        process.exit(1);
    }
}

runTests();
