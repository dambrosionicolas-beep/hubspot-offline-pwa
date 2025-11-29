
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    en: {
        'nav.contacts': 'Contacts',
        'nav.companies': 'Companies',
        'nav.deals': 'Deals',
        'nav.tickets': 'Tickets',
        'nav.settings': 'Settings',
        'nav.online': 'Online',
        'nav.offline': 'Offline',
        'nav.syncing': 'Syncing...',
        'nav.pending': 'pending',
        "nav.contact_us": "Contact Us",
        "settings.title": "Settings",
        "settings.subtitle": "Configure your HubSpot connection.",
        "settings.api_config": "HubSpot API Configuration",
        "settings.api_desc": "Enter your HubSpot Private App Access Token to enable real synchronization.",
        "settings.save": "Save",
        "settings.saved": "Settings saved successfully!",
        "settings.how_to": "How to get your Access Token",
        "settings.step1": "Log in to your HubSpot account and click the Settings icon (gear) in the main navigation bar.",
        "settings.step2": "In the left sidebar menu, navigate to Integrations > Private Apps.",
        "settings.step3": "Click Create a private app.",
        "settings.step4": "Give your app a name (e.g., \"Offline PWA\").",
        "settings.step5": "Click the Scopes tab. You need to select the following scopes to allow the app to read and write data:",
        "settings.step6": "Click Create app (top right) and confirm.",
        "settings.step7": "Click Show token under \"Access token\" and copy it.",
        "settings.step8": "Paste the token in the field above and click Save.",
        "settings.note": "Note: This token is stored locally in your browser. Ensure you are using a secure device.",
        "settings.docs": "Read official documentation",
        'common.refresh': 'Refresh',
        'common.new': 'New',
        'common.search': 'Search',
        'common.show': 'Show',
        'common.previous': 'Previous',
        'common.next': 'Next',
        'common.showing': 'Showing',
        'common.to': 'to',
        'common.of': 'of',
        'common.results': 'results',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.back': 'Back',
        'common.loading': 'Loading...',
        'common.no_results': 'No results found.',
        'sync.fetching': 'Fetching',
        'sync.saving': 'Saving',
        'sync.complete': 'Complete!',
        'sync.success': 'Successfully synced',
    },
    fr: {
        'nav.contacts': 'Contacts',
        'nav.companies': 'Entreprises',
        'nav.deals': 'Transactions',
        'nav.tickets': 'Tickets',
        'nav.settings': 'Paramètres',
        'nav.online': 'En ligne',
        'nav.offline': 'Hors ligne',
        'nav.syncing': 'Synchronisation...',
        "nav.contact_us": "Contactez-nous",
        "settings.title": "Paramètres",
        "settings.subtitle": "Configurez votre connexion HubSpot.",
        "settings.api_config": "Configuration API HubSpot",
        "settings.api_desc": "Entrez votre jeton d'accès Private App HubSpot pour activer la synchronisation réelle.",
        "settings.save": "Enregistrer",
        "settings.saved": "Paramètres enregistrés avec succès !",
        "settings.how_to": "Comment obtenir votre jeton d'accès",
        "settings.step1": "Connectez-vous à votre compte HubSpot et cliquez sur l'icône Paramètres (engrenage).",
        "settings.step2": "Dans le menu latéral gauche, accédez à Intégrations > Applications privées.",
        "settings.step3": "Cliquez sur Créer une application privée.",
        "settings.step4": "Donnez un nom à votre application (ex: \"Offline PWA\").",
        "settings.step5": "Cliquez sur l'onglet Scopes. Sélectionnez les scopes suivants :",
        "settings.step6": "Cliquez sur Créer l'application (en haut à droite) et confirmez.",
        "settings.step7": "Cliquez sur Afficher le jeton sous \"Jeton d'accès\" et copiez-le.",
        "settings.step8": "Collez le jeton dans le champ ci-dessus et cliquez sur Enregistrer.",
        "settings.note": "Remarque : Ce jeton est stocké localement dans votre navigateur. Assurez-vous d'utiliser un appareil sécurisé.",
        "settings.docs": "Lire la documentation officielle",
        'common.refresh': 'Actualiser',
        'common.new': 'Nouveau',
        'common.search': 'Rechercher',
        'common.show': 'Afficher',
        'common.previous': 'Précédent',
        'common.next': 'Suivant',
        'common.showing': 'Affichage de',
        'common.to': 'à',
        'common.of': 'sur',
        'common.results': 'résultats',
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'common.back': 'Retour',
        'common.loading': 'Chargement...',
        'common.no_results': 'Aucun résultat trouvé.',
        'sync.fetching': 'Récupération',
        'sync.saving': 'Enregistrement',
        'sync.complete': 'Terminé !',
        'sync.success': 'Synchronisation réussie',
    }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved === 'en' || saved === 'fr') ? saved : 'fr';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    const t = (key: string) => {
        const value = (translations[language] as any)[key];
        return value || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}
