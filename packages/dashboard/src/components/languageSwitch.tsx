import React from 'react';
import { useTranslation } from 'react-i18next';
import tr from '../assets/tr.png';
import en from '../assets/en.png';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: any) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <img
        src={en}
        alt="en"
        style={{ width: '30px', height: '30px' }}
        onClick={() => changeLanguage('en')}
      />

      <img
        src={tr}
        alt="tr"
        style={{ width: '30px', height: '30px' }}
        onClick={() => changeLanguage('tr')}
      />
    </div>
  );
}

export default LanguageSwitcher;
