import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { db } from '../db';
import { useSync } from '../useSync';

export function SyncStatus() {
    const { isOnline, isSyncing } = useSync();

    const queue = useLiveQuery(() => db.syncQueue.toArray());

    const handleRetry = async (id: number) => {
        await db.syncQueue.update(id, { status: 'pending', error: undefined });
        // Trigger sync via window event or just wait for next poll/online event
        window.dispatchEvent(new Event('online'));
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this sync item? The change will not be synced to HubSpot.')) {
            await db.syncQueue.delete(id);
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'failed': return <AlertCircle className="text-red-500" size={20} />;
            case 'processing': return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
            default: return <Clock className="text-gray-400" size={20} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Sync Status</h1>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                    {isSyncing && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Syncing...
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {queue?.map((item) => (
                        <li key={item.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(item.status)}
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 truncate">
                                            {item.type.toUpperCase()} {item.entity.toUpperCase()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                        {item.error && (
                                            <p className="text-xs text-red-600 mt-1">
                                                Error: {item.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.status === 'failed' && (
                                        <button
                                            onClick={() => item.id && handleRetry(item.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                            title="Retry"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => item.id && handleDelete(item.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(item.data, null, 2)}
                            </div>
                        </li>
                    ))}
                    {queue?.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                            <p>All changes synced!</p>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
