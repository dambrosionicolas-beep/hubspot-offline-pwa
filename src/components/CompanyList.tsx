
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Plus, Building2, Cloud, CloudOff, Clock } from 'lucide-react';
import { db } from '../db';
import { api } from '../api';

import { useState } from 'react';

import { useTranslation } from '../i18n';
import { Pagination } from './Pagination';

export function CompanyList() {
    const companies = useLiveQuery(() => db.companies.orderBy('updatedAt').reverse().toArray());
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const { t } = useTranslation();

    const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);

    const handleRefresh = async () => {
        if (navigator.onLine) {
            try {
                setSyncProgress({ current: 10, total: 100, message: t('sync.fetching') + ' ' + t('nav.companies') + '...' });
                const remoteCompanies = await api.fetchCompanies();

                setSyncProgress({ current: 40, total: 100, message: t('sync.saving') + ' ' + t('nav.companies') + '...' });
                await db.companies.bulkPut(remoteCompanies);

                // Also sync activities
                setSyncProgress({ current: 60, total: 100, message: t('sync.fetching') + ' activities...' });
                const remoteActivities = await api.fetchActivities();

                setSyncProgress({ current: 90, total: 100, message: t('sync.saving') + ' activities...' });
                await db.activities.bulkPut(remoteActivities);

                setSyncProgress({ current: 100, total: 100, message: t('sync.complete') });
                setTimeout(() => setSyncProgress(null), 1000);

                // alert(`Successfully synced ${remoteCompanies.length} companies and ${remoteActivities.length} activities from HubSpot!`);
            } catch (error) {
                console.error('Failed to fetch companies', error);
                alert('Failed to sync companies. Check console for details.');
                setSyncProgress(null);
            }
        }
    };

    // Filter and Paginate
    const filteredCompanies = companies?.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.domain.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const _totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{t('nav.companies')}</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={!!syncProgress}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        {syncProgress ? t('nav.syncing') : t('common.refresh')}
                    </button>
                    <Link
                        to="/companies/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        <Plus size={16} />
                        {t('common.new')} Company
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
                            style={{ width: `${syncProgress.current}%` }}
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
                    {paginatedCompanies.map((company) => (
                        <li key={company.id}>
                            <Link to={`/companies/${company.id}`} className="block hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    <Building2 size={20} />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-blue-600 truncate">
                                                    {company.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {company.domain}
                                                    {company.city && <span className="ml-2 text-gray-400">• {company.city}</span>}
                                                    {company.phone && <span className="ml-2 text-gray-400">• {company.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center text-xs text-gray-400">
                                                {new Date(company.updatedAt).toLocaleDateString()}
                                            </div>
                                            {/* Sync Status Icon */}
                                            {company.syncStatus === 'synced' ? (
                                                <div title="Synced"><Cloud size={16} className="text-green-500" /></div>
                                            ) : company.syncStatus.startsWith('pending') ? (
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
                    {paginatedCompanies.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            {t('common.no_results')}
                        </li>
                    )}
                </ul>
            </div>

            <Pagination
                currentPage={currentPage}
                totalItems={filteredCompanies.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
