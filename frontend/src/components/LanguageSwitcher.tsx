import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  ];

  // Get current language, handling potential language variants (e.g., en-US -> en)
  const currentLangCode = i18n.language?.split('-')[0] || 'en';
  const currentLanguage = languages.find(lang => lang.code === currentLangCode) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  // Initialize Bootstrap dropdown when component mounts
  useEffect(() => {
    const initDropdown = async () => {
      try {
        // Dynamically import Bootstrap's Dropdown
        const { Dropdown } = await import('bootstrap');
        if (dropdownRef.current) {
          const dropdownElement = dropdownRef.current.querySelector('[data-bs-toggle="dropdown"]');
          if (dropdownElement) {
            new Dropdown(dropdownElement);
          }
        }
      } catch (error) {
        console.warn('Could not initialize Bootstrap dropdown:', error);
      }
    };

    initDropdown();
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <button
        className="btn btn-outline-secondary dropdown-toggle"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        title={t('language.changeLanguage')}
      >
        <span className="me-1">{currentLanguage.flag}</span>
        <span className="d-none d-md-inline">{currentLanguage.name}</span>
      </button>
      <ul className="dropdown-menu">
        {languages.map((language) => (
          <li key={language.code}>
            <button
              className={`dropdown-item ${currentLangCode === language.code ? 'active' : ''}`}
              onClick={() => changeLanguage(language.code)}
            >
              <span className="me-2">{language.flag}</span>
              {language.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageSwitcher;