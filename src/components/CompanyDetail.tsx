import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, ArrowLeft } from 'lucide-react';
import { db } from '../db';
import { ActivityTimeline } from './ActivityTimeline';

export function CompanyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        industry: '',
        phone: '',
        city: '',
        website: '',
        description: ''
    });

    const company = useLiveQuery(async () => {
        if (!isNew && id) return await db.companies.get(id);
        return null;
    }, [id, isNew]);

    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name,
                domain: company.domain,
                industry: company.industry || '',
                phone: company.phone || '',
                city: company.city || '',
                website: company.website || '',
                description: company.description || ''
            });
        }
    }, [company]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const timestamp = Date.now();
        const companyData = { ...formData, updatedAt: timestamp };

        if (!isNew && id) {
            await db.companies.update(id, { ...companyData, syncStatus: 'pending_update' });
            await db.syncQueue.add({ type: 'update', entity: 'company', data: { id, ...companyData }, timestamp });
        } else {
            const tempId = crypto.randomUUID();
            await db.companies.add({ id: tempId, ...companyData, syncStatus: 'pending_create' });
            await db.syncQueue.add({ type: 'create', entity: 'company', data: { id: tempId, ...companyData }, timestamp });
        }
        navigate('/companies');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/companies')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New Company' : 'Edit Company'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Domain</label>
                        <input
                            type="text"
                            required
                            value={formData.domain}
                            onChange={e => setFormData({ ...formData, domain: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Industry</label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={e => setFormData({ ...formData, industry: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
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
                        Save Company
                    </button>
                </div>
            </form>

            {!isNew && id && (
                <ActivityTimeline entityType="company" entityId={id} />
            )}
        </div>
    );
}
