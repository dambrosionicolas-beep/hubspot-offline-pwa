
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Plus, Cloud, CloudOff, Clock, Ticket } from 'lucide-react';
import { db } from '../db';
import { api } from '../api';

import { useState } from 'react';

import { useTranslation } from '../i18n';

export function TicketList() {
    const tickets = useLiveQuery(() => db.tickets.orderBy('updatedAt').reverse().toArray());
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useTranslation();

    const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);

    const handleRefresh = async () => {
        if (navigator.onLine) {
            try {
                setSyncProgress({ current: 10, total: 100, message: t('sync.fetching') + ' ' + t('nav.tickets') + '...' });
                const remoteTickets = await api.fetchTickets();

                setSyncProgress({ current: 40, total: 100, message: t('sync.saving') + ' ' + t('nav.tickets') + '...' });
                await db.tickets.bulkPut(remoteTickets);

                // Also sync activities
                setSyncProgress({ current: 60, total: 100, message: t('sync.fetching') + ' activities...' });
                const remoteActivities = await api.fetchActivities();

                setSyncProgress({ current: 90, total: 100, message: t('sync.saving') + ' activities...' });
                await db.activities.bulkPut(remoteActivities);

                setSyncProgress({ current: 100, total: 100, message: t('sync.complete') });
                setTimeout(() => setSyncProgress(null), 1000);

                // alert(`Successfully synced ${ remoteTickets.length } tickets and ${ remoteActivities.length } activities from HubSpot!`);
            } catch (error) {
                console.error('Failed to fetch tickets', error);
                alert('Failed to sync tickets. Check console for details.');
                setSyncProgress(null);
            }
        }
    };

    // Filter and Paginate
    const filteredTickets = tickets?.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.content.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{t('nav.tickets')}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={!!syncProgress}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        {syncProgress ? t('nav.syncing') : t('common.refresh')}
                    </button>
                    <Link
                        to="/tickets/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        <Plus size={16} />
                        {t('common.new')} Ticket
                    </Link>
                </div>
            </div>

            {/* Progress Bar */}
            {syncProgress && (
                <div className="bg-white p-4 rounded-md shadow">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{syncProgress.message}</span>
                        <span>{syncProgress.current}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${syncProgress.current}% ` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Search and Pagination Controls */}
            <div className="bg-white p-4 rounded-md shadow flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder={t('common.search') + "..."}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{t('common.show')}:</span>
                    <select
                        className="border border-gray-300 rounded-md text-sm p-1"
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {paginatedTickets.map((ticket) => (
                        <li key={ticket.id}>
                            <Link to={`/tickets/${ticket.id}`} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    <Ticket size={20} />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-blue-600 truncate">
                                                    {ticket.subject}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {ticket.content}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500 gap-2">
                                                    <span className={`px - 2 py - 0.5 rounded - full text - xs ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        } `}>
                                                        {ticket.priority}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{ticket.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center text-xs text-gray-400">
                                                {new Date(ticket.updatedAt).toLocaleDateString()}
                                            </div>
                                            {/* Sync Status Icon */}
                                            {ticket.syncStatus === 'synced' ? (
                                                <div title="Synced"><Cloud size={16} className="text-green-500" /></div>
                                            ) : ticket.syncStatus.startsWith('pending') ? (
                                                <div title="Pending Sync"><Clock size={16} className="text-amber-500" /></div>
                                            ) : (
                                                <div title="Sync Error"><CloudOff size={16} className="text-red-500" /></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                    {paginatedTickets.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            {t('common.no_results')}
                        </li>
                    )}
                </ul>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                {t('common.previous')}
                            </button>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                {t('common.next')}
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    {t('common.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('common.to')} <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> {t('common.of')} <span className="font-medium">{filteredTickets.length}</span> {t('common.results')}
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {t('common.previous')}
                                    </button>
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`relative inline - flex items - center px - 4 py - 2 border text - sm font - medium ${currentPage === i + 1
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                } `}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        {t('common.next')}
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
