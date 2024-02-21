import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import tr from '../assets/tr.png';
import en from '../assets/en.png';
import { Button, Menu, MenuItem, Typography } from '@mui/material';
import { useMediaQuery } from 'react-responsive';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeLanguage, setActiveLanguage] = useState(i18n.language);
  const isTablet = useMediaQuery({ query: '(max-width: 1224px) and (min-height: 500px)' });

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget as HTMLButtonElement);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setActiveLanguage(lng);
    handleMenuClose();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginLeft: isTablet ? '0px' : '18px',
      }}
    >
      {isTablet ? null : (
        <Typography style={{ color: 'black', fontWeight: 'medium', fontSize: '1rem' }}>
          {t('activeLanguage')}
        </Typography>
      )}
      <Button
        sx={{ width: isTablet ? '20px' : '30px', height: isTablet ? '30px' : '30px' }}
        onClick={handleMenuOpen}
        style={{
          backgroundImage: `url(${activeLanguage === 'en' ? en : tr})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => changeLanguage('en')}>
          <img src={en} alt="en" style={{ width: '30px', height: '20px', marginRight: '10px' }} />
          {t('english')}
        </MenuItem>
        <MenuItem onClick={() => changeLanguage('tr')}>
          <img src={tr} alt="tr" style={{ width: '30px', height: '20px', marginRight: '10px' }} />
          {t('turkish')}
        </MenuItem>
      </Menu>
    </div>
  );
}

export default LanguageSwitcher;
