import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
    const { t } = useTranslation();
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-b-md">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('common.previous')}
                </button>
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('common.next')}
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        {t('common.showing')} <span className="font-medium">{startItem}</span> {t('common.to')} <span className="font-medium">{endItem}</span> {t('common.of')} <span className="font-medium">{totalItems}</span> {t('common.results')}
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">{t('common.previous')}</span>
                            <ChevronLeft size={20} />
                        </button>

                        {/* Simple page numbers for now. Could be improved with ellipsis for many pages. */}
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            // Show first, last, current, and neighbors
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        aria-current={currentPage === page ? 'page' : undefined}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                (page === currentPage - 2 && page > 1) ||
                                (page === currentPage + 2 && page < totalPages)
                            ) {
                                return (
                                    <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        ...
                                    </span>
                                );
                            }
                            return null;
                        })}

                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">{t('common.next')}</span>
                            <ChevronRight size={20} />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}
