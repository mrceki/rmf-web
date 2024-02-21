import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import tr from '../assets/tr.png';
import en from '../assets/en.png';
import { Button } from '@mui/material';
import CustomButton from './CustomButtonComponent';
import { useMediaQuery } from 'react-responsive';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState(i18n.language);

  const changeLanguage = (lng: any) => {
    i18n.changeLanguage(lng);
    setActiveLanguage(lng);
  };
  const isTablet = useMediaQuery({ query: '(max-width: 1224px) and (min-height: 500px)' });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isTablet ? 'column' : 'row',
        marginTop: '2rem',
        marginBottom: '0rem',
      }}
    >
      <CustomButton
        onClick={() => changeLanguage('en')}
        color={activeLanguage === 'en' ? '#C1C1B4' : 'transparent'}
        property={['0rem', '0rem']}
        border="none"
        radius="30px"
      >
        <img src={en} alt="en" style={{ width: '30px', height: '20px' }} />
      </CustomButton>
      <CustomButton
        onClick={() => changeLanguage('tr')}
        color={activeLanguage === 'tr' ? '#C1C1B4' : 'transparent'}
        property={['0rem', '0rem']}
        border="none"
        radius="30px"
      >
        <img src={tr} alt="tr" style={{ width: '30px', height: '20px' }} />
      </CustomButton>
    </div>
  );
}

export default LanguageSwitcher;
