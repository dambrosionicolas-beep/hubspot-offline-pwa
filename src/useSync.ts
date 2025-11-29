import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SyncQueueItem } from './db';
import { api } from './api';

export function useSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor sync queue
    const queue = useLiveQuery(() => db.syncQueue.toArray());

    // Sync logic
    const processQueue = async () => {
        if (!isOnline || isSyncing || !queue || queue.length === 0) return;

        setIsSyncing(true);
        try {
            // Process items one by one (FIFO)
            // We re-fetch the queue to ensure we have the latest state and order
            // Only process pending items or items that haven't failed yet (unless retried)
            const currentQueue = await db.syncQueue
                .filter(item => item.status !== 'failed')
                .sortBy('id');

            for (const item of currentQueue) {
                try {
                    // Mark as processing
                    await db.syncQueue.update(item.id!, { status: 'processing' });

                    await processItem(item);

                    // If successful, remove from queue
                    if (item.id) {
                        await db.syncQueue.delete(item.id);
                    }
                } catch (error: any) {
                    console.error('Sync failed for item:', item, error);
                    // Mark as failed and store error
                    if (item.id) {
                        await db.syncQueue.update(item.id, {
                            status: 'failed',
                            error: error.message || 'Unknown error'
                        });
                    }
                    // Continue to next item? 
                    // If we continue, we might violate order dependencies (e.g. update before create).
                    // But for now, to unblock the user, we will continue.
                    // A more robust solution would check dependencies.
                }
            }
            setLastSyncTime(Date.now());
        } finally {
            setIsSyncing(false);
        }
    };

    const processItem = async (item: SyncQueueItem) => {
        switch (item.type) {
            case 'create':
                if (item.entity === 'contact') {
                    const created = await api.createContact(item.data);
                    await db.contacts.update(item.data.id, { syncStatus: 'synced', updatedAt: created.updatedAt });
                } else if (item.entity === 'company') {
                    const created = await api.createCompany(item.data);
                    await db.companies.update(item.data.id, { syncStatus: 'synced', updatedAt: created.updatedAt });
                } else if (item.entity === 'deal') {
                    const created = await api.createDeal(item.data);
                    await db.deals.update(item.data.id, { syncStatus: 'synced', updatedAt: created.updatedAt });
                } else if (item.entity === 'ticket') {
                    const created = await api.createTicket(item.data);
                    await db.tickets.update(item.data.id, { syncStatus: 'synced', updatedAt: created.updatedAt });
                } else if (item.entity === 'activity') {
                    const created = await api.createActivity(item.data);
                    await db.activities.update(item.data.id, { syncStatus: 'synced', updatedAt: created.updatedAt });
                }
                break;
            case 'update':
                if (item.entity === 'contact') {
                    await api.updateContact(item.data.id, item.data);
                    await db.contacts.update(item.data.id, { syncStatus: 'synced' });
                } else if (item.entity === 'company') {
                    await api.updateCompany(item.data.id, item.data);
                    await db.companies.update(item.data.id, { syncStatus: 'synced' });
                } else if (item.entity === 'deal') {
                    await api.updateDeal(item.data.id, item.data);
                    await db.deals.update(item.data.id, { syncStatus: 'synced' });
                } else if (item.entity === 'ticket') {
                    await api.updateTicket(item.data.id, item.data);
                    await db.tickets.update(item.data.id, { syncStatus: 'synced' });
                }
                break;
            case 'delete':
                if (item.entity === 'contact') await api.deleteContact(item.data.id);
                // Add delete support for other entities if needed
                break;
        }
    };
    // Trigger sync when online or queue changes
    useEffect(() => {
        if (isOnline && queue && queue.length > 0) {
            processQueue();
        }
    }, [isOnline, queue?.length]);

    return { isOnline, isSyncing, lastSyncTime, queueLength: queue?.length || 0 };
}
