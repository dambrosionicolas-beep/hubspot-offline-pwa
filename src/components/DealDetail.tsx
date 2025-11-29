import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, ArrowLeft } from 'lucide-react';
import { db } from '../db';
import { ActivityTimeline } from './ActivityTimeline';

export function DealDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [formData, setFormData] = useState({
        name: '',
        amount: 0,
        stage: 'new',
        closedate: '',
        dealtype: '',
        description: ''
    });

    const deal = useLiveQuery(async () => {
        if (!isNew && id) return await db.deals.get(id);
        return null;
    }, [id, isNew]);

    useEffect(() => {
        if (deal) {
            setFormData({
                name: deal.name,
                amount: deal.amount,
                stage: deal.stage,
                closedate: deal.closedate || '',
                dealtype: deal.dealtype || '',
                description: deal.description || ''
            });
        }
    }, [deal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const timestamp = Date.now();
        let dealData = { ...formData, contactIds: [], updatedAt: timestamp };

        if (!isNew && id) {
            await db.deals.update(id, { ...dealData, syncStatus: 'pending_update' });
            await db.syncQueue.add({ type: 'update', entity: 'deal', data: { id, ...dealData }, timestamp });
        } else {
            const tempId = crypto.randomUUID();
            const newDealData = { ...dealData, pipeline: 'default' };
            await db.deals.add({ id: tempId, ...newDealData, syncStatus: 'pending_create' });
            await db.syncQueue.add({ type: 'create', entity: 'deal', data: { id: tempId, ...newDealData }, timestamp });
        }
        navigate('/deals');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/deals')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Deal' : 'Edit Deal'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Deal Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="number"
                            required
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Stage</label>
                        <select
                            value={formData.stage}
                            onChange={e => setFormData({ ...formData, stage: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="new">New</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed_won">Closed Won</option>
                            <option value="closed_lost">Closed Lost</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Close Date</label>
                        <input
                            type="date"
                            value={formData.closedate ? new Date(formData.closedate).toISOString().split('T')[0] : ''}
                            onChange={e => setFormData({ ...formData, closedate: new Date(e.target.value).toISOString() })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Deal Type</label>
                        <select
                            value={formData.dealtype}
                            onChange={e => setFormData({ ...formData, dealtype: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="">Select Type</option>
                            <option value="newbusiness">New Business</option>
                            <option value="existingbusiness">Existing Business</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        <Save size={16} />
                        Save Deal
                    </button>
                </div>
            </form>

            {!isNew && id && (
                <ActivityTimeline entityType="deal" entityId={id} />
            )}
        </div>
    );
}
