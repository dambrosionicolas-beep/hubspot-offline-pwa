import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, ArrowLeft } from 'lucide-react';
import { db } from '../db';
import { ActivityTimeline } from './ActivityTimeline';

export function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [formData, setFormData] = useState({
        subject: '',
        content: '',
        status: 'open',
        priority: 'medium'
    });

    const ticket = useLiveQuery(async () => {
        if (!isNew && id) return await db.tickets.get(id);
        return null;
    }, [id, isNew]);

    useEffect(() => {
        if (ticket) {
            setFormData({
                subject: ticket.subject,
                content: ticket.content,
                status: ticket.status,
                priority: ticket.priority
            });
        }
    }, [ticket]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const timestamp = Date.now();
        const ticketData = { ...formData, updatedAt: timestamp };

        if (!isNew && id) {
            await db.tickets.update(id, { ...ticketData, syncStatus: 'pending_update' });
            await db.syncQueue.add({ type: 'update', entity: 'ticket', data: { id, ...ticketData }, timestamp });
        } else {
            const tempId = crypto.randomUUID();
            await db.tickets.add({ id: tempId, ...ticketData, syncStatus: 'pending_create' });
            await db.syncQueue.add({ type: 'create', entity: 'ticket', data: { id: tempId, ...ticketData }, timestamp });
        }
        navigate('/tickets');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/tickets')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Ticket' : 'Edit Ticket'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                            type="text"
                            required
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            required
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            >
                                <option value="open">Open</option>
                                <option value="pending">Pending</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        <Save size={16} />
                        Save Ticket
                    </button>
                </div>
            </form>

            {!isNew && id && (
                <ActivityTimeline entityType="ticket" entityId={id} />
            )}
        </div>
    );
}
