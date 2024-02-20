import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import tr from '../assets/tr.png';
import en from '../assets/en.png';
import { Button } from '@mui/material';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState(i18n.language);

  const changeLanguage = (lng: any) => {
    i18n.changeLanguage(lng);
    setActiveLanguage(lng);
  };

  return (
    <div>
      <Button
        onClick={() => changeLanguage('en')}
        style={{ backgroundColor: activeLanguage === 'en' ? 'lightblue' : 'transparent' }}
      >
        <img src={en} alt="en" style={{ width: '30px', height: '30px' }} />
      </Button>

      <Button
        onClick={() => changeLanguage('tr')}
        style={{ backgroundColor: activeLanguage === 'tr' ? 'lightblue' : 'transparent' }}
      >
        <img src={tr} alt="tr" style={{ width: '30px', height: '30px' }} />
      </Button>
    </div>
  );
}

export default LanguageSwitcher;
