import React, { useState, useEffect } from 'react';
import { Save, Key, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

import { useTranslation } from '../i18n';

export function Settings() {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const storedKey = localStorage.getItem('hubspot_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('hubspot_api_key', apiKey);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
                <p className="mt-1 text-sm text-gray-500">{t('settings.subtitle')}</p>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                        <Key size={20} className="text-gray-400" />
                        {t('settings.api_config')}
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>{t('settings.api_desc')}</p>
                    </div>
                    <form onSubmit={handleSave} className="mt-5 sm:flex sm:items-center">
                        <div className="w-full sm:max-w-xs">
                            <label htmlFor="api-key" className="sr-only">API Key</label>
                            <input
                                type="password"
                                name="api-key"
                                id="api-key"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="pat-na1-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            <Save size={16} className="mr-2" />
                            {t('settings.save')}
                        </button>
                    </form>
                    {saved && (
                        <div className="mt-2 flex items-center text-sm text-green-600">
                            <CheckCircle size={16} className="mr-1" />
                            {t('settings.saved')}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {t('settings.how_to')}
                    </h3>

                    <div className="prose prose-sm text-gray-500 space-y-4">
                        <p>
                            {t('settings.step1').split('Private App')[0]} <strong>Private App</strong>.
                        </p>

                        <ol className="list-decimal list-inside space-y-2">
                            <li>{t('settings.step1')}</li>
                            <li>{t('settings.step2')}</li>
                            <li>{t('settings.step3')}</li>
                            <li>{t('settings.step4')}</li>
                            <li>
                                {t('settings.step5')}
                                <ul className="list-disc list-inside ml-4 mt-1 bg-gray-50 p-2 rounded border border-gray-200">
                                    <li><code>crm.objects.contacts.read</code> & <code>write</code></li>
                                    <li><code>crm.objects.companies.read</code> & <code>write</code></li>
                                    <li><code>crm.objects.deals.read</code> & <code>write</code></li>
                                    <li><code>tickets</code> (read & write)</li>
                                </ul>
                            </li>
                            <li>{t('settings.step6')}</li>
                            <li>{t('settings.step7')}</li>
                            <li>{t('settings.step8')}</li>
                        </ol>

                        <div className="mt-4 p-4 bg-blue-50 rounded-md flex items-start">
                            <AlertCircle className="text-blue-400 mt-0.5 mr-3 flex-shrink-0" size={20} />
                            <p className="text-blue-700 text-sm">
                                <strong>Note:</strong> {t('settings.note')}
                            </p>
                        </div>

                        <div className="mt-6">
                            <a
                                href="https://developers.hubspot.com/docs/api/private-apps"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-500"
                            >
                                {t('settings.docs')} <ExternalLink size={14} className="ml-1" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
