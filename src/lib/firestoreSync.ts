import { db } from './firebase';
import { collection, getDocs, doc, writeBatch, setDoc } from 'firebase/firestore';

const COLLECTION_MAP: Record<string, string> = {
    'cerejas_items': 'items',
    'cerejas_clients': 'clients',
    'cerejas_orders': 'orders',
    'cerejas_suppliers': 'suppliers',
    'cerejas_users_db': 'users',
    'cerejas_audit_logs': 'audit_logs'
};

/**
 * Downloads ALL data from Firestore and populates LocalStorage.
 * This should be called ONCE on app startup.
 */
export async function pullFromFirestore() {
    console.log('Sync: Pulling data from Firestore...');

    // Check if network is online to avoid hanging
    if (!navigator.onLine) {
        console.warn('Sync: Offline, skipping pull.');
        return;
    }

    try {
        const promises = Object.entries(COLLECTION_MAP).map(async ([storageKey, collectionName]) => {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const data: any[] = [];
                querySnapshot.forEach((doc) => {
                    data.push(doc.data());
                });

                // IMPORTANT: Only overwrite localStorage if Firebase has data
                // This prevents wiping local data if Firebase is empty or inaccessible
                if (data.length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                    console.log(`✅ Sync: Pulled ${data.length} records for ${collectionName}`);
                } else {
                    // Check if we have local data
                    const localData = localStorage.getItem(storageKey);
                    if (localData) {
                        console.log(`⚠️ Sync: Firebase is empty for ${collectionName}, keeping local data`);
                    }
                }
            } catch (collectionError: any) {
                console.error(`❌ Sync Error for ${collectionName}:`, collectionError.message);
                if (collectionError.code === 'permission-denied') {
                    console.error('🔒 FIREBASE PERMISSION DENIED: Configure Firestore rules in Firebase Console');
                }
            }
        });

        await Promise.all(promises);
        console.log('Sync: Pull complete.');
    } catch (error: any) {
        console.error('Sync: Error pulling data', error);
        if (error.code === 'permission-denied') {
            console.error('🔒 FIREBASE PERMISSION DENIED: You need to update Firestore rules.');
            console.error('Go to: https://console.firebase.google.com/project/cerejas-festas/firestore/rules');
        }
    }
}

/**
 * Pushes a full dataset to Firestore (Overwrites collection logic or updates docs).
 * For simplicity in this "Hybrid" model, we will save individual items if possible,
 * or batch write.
 * 
 * Strategy: When `saveToStorage` is called, we receive the FULL ARRAY.
 * We should ideally only update what changed, but we don't know that.
 * So we will loop and `setDoc` for each item. This is write-heavy but ensures consistency.
 */
export async function pushToFirestore(storageKey: string, data: any[]) {
    const collectionName = COLLECTION_MAP[storageKey];
    if (!collectionName) return;

    if (!navigator.onLine) {
        console.warn('Sync: Offline, cannot push to Firestore.');
        // TODO: Queue for later? For now, we accept risk of unsynced data until next online save.
        return;
    }

    try {
        // We use a Batch to be efficient, but Batch has limit of 500 ops.
        // For small business (few hundred items), we can chunk it.

        const chunks = [];
        let currentChunk = [];

        for (const item of data) {
            currentChunk.push(item);
            if (currentChunk.length >= 450) {
                chunks.push(currentChunk);
                currentChunk = [];
            }
        }
        if (currentChunk.length > 0) chunks.push(currentChunk);

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((item: any) => {
                const docRef = doc(db, collectionName, String(item.id));
                batch.set(docRef, item);
            });
            await batch.commit();
        }

        console.log(`Sync: Pushed ${data.length} items to ${collectionName}`);

    } catch (error) {
        console.error(`Sync: Error pushing to ${collectionName}`, error);
    }
}
