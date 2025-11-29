import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, ArrowLeft, Trash2 } from 'lucide-react';
import { db } from '../db';
import { ActivityTimeline } from './ActivityTimeline';

export function ContactForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyId: '',
        mobilephone: '',
        jobtitle: '',
        company: '',
        industry: '',
        lifecyclestage: '',
        address: '',
        city: '',
        state: '',
        country: '',
        website: ''
    });

    // Load data if editing
    const contact = useLiveQuery(async () => {
        if (id) return await db.contacts.get(id);
        return null;
    }, [id]);

    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone || '',
                companyId: contact.companyId || '',

                // Extended fields
                mobilephone: contact.mobilephone || '',
                jobtitle: contact.jobtitle || '',
                company: contact.company || '',
                industry: contact.industry || '',
                lifecyclestage: contact.lifecyclestage || '',
                address: contact.address || '',
                city: contact.city || '',
                state: contact.state || '',
                country: contact.country || '',
                website: contact.website || ''
            });
        }
    }, [contact]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const timestamp = Date.now();
        const contactData = {
            ...formData,
            updatedAt: timestamp,
        };

        if (isEdit && id) {
            // Update
            await db.contacts.update(id, {
                ...contactData,
                syncStatus: 'pending_update'
            });

            // Add to Sync Queue
            await db.syncQueue.add({
                type: 'update',
                entity: 'contact',
                data: { id, ...contactData },
                timestamp
            });
        } else {
            // Create
            // Generate a temporary ID (UUID-like)
            const tempId = crypto.randomUUID();

            await db.contacts.add({
                id: tempId,
                ...contactData,
                syncStatus: 'pending_create'
            });

            // Add to Sync Queue
            await db.syncQueue.add({
                type: 'create',
                entity: 'contact',
                data: { id: tempId, ...contactData },
                timestamp
            });
        }

        navigate('/');
    };

    const handleDelete = async () => {
        if (!id || !confirm('Are you sure?')) return;

        await db.contacts.delete(id);
        await db.syncQueue.add({
            type: 'delete',
            entity: 'contact',
            data: { id },
            timestamp: Date.now()
        });
        navigate('/');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEdit ? 'Edit Contact' : 'New Contact'}
                    </h1>
                </div>
                {isEdit && (
                    <button
                        onClick={handleDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-md p-6 space-y-6">
                <div className="space-y-8">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                                <label className="block text-sm font-medium text-gray-700">Mobile Phone</label>
                                <input
                                    type="tel"
                                    value={formData.mobilephone}
                                    onChange={e => setFormData({ ...formData, mobilephone: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Info */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Professional Details</h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                                <input
                                    type="text"
                                    value={formData.jobtitle}
                                    onChange={e => setFormData({ ...formData, jobtitle: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
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
                                <label className="block text-sm font-medium text-gray-700">Lifecycle Stage</label>
                                <input
                                    type="text"
                                    value={formData.lifecyclestage}
                                    onChange={e => setFormData({ ...formData, lifecyclestage: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Address</h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                                <label className="block text-sm font-medium text-gray-700">State/Region</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
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
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Save size={16} />
                        Save Contact
                    </button>
                </div>
            </form>

            {isEdit && id && (
                <ActivityTimeline entityType="contact" entityId={id} />
            )}
        </div>
    );
}
