import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcherSimple: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  // Get current language, handling potential language variants (e.g., en-US -> en)
  const currentLangCode = i18n.language?.split('-')[0] || 'en';
  const currentLanguage = languages.find(lang => lang.code === currentLangCode) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  const handleBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is within the dropdown
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="dropdown" onBlur={handleBlur} tabIndex={-1}>
      <button
        className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        title={t('language.changeLanguage')}
      >
        <span className="me-1">{currentLanguage.flag}</span>
        <span className="d-none d-md-inline">{currentLanguage.name}</span>
      </button>
      {isOpen && (
        <ul className="dropdown-menu show" style={{ position: 'absolute', top: '100%', left: '0', zIndex: 1000 }}>
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
      )}
    </div>
  );
};

export default LanguageSwitcherSimple;