import { Typography } from '@mui/material';
import React from 'react';
import { SettingsContext } from './app-contexts';
import { useMediaQuery } from 'react-responsive';

interface Props {
  border: string;
  color: string;
  children?: React.ReactNode;
  onClick: (id: string) => void;
  radius: string;
  // height: string;
  // width: string;
  title: string;
  property: string[];
  id: string;
  setActiveButton: (id: string) => void;
  activeButton: string;
}

const AppBarTab: React.FC<Props> = ({
  border,
  color,
  children,
  onClick,
  radius,
  // height,
  // width,
  title,
  property,
  id,
  setActiveButton,
  activeButton,
}) => {
  const curTheme = React.useContext(SettingsContext).themeMode;
  const isTablet = useMediaQuery({ query: '(max-width: 1224px) and (min-height: 500px)' });
  const isActive = id === activeButton;

  const handleClick = () => {
    onClick(id);
    setActiveButton(id);
  };
  console.log('isTablet', isTablet);
  return (
    <button
      onClick={() => {
        handleClick();
      }}
      style={{
        backgroundColor:
          curTheme === 2 ? (isActive ? '#2B3C43' : color) : isActive ? '#C1C1B4' : color,
        border: border,
        borderRadius: radius,
        // height,
        // width,
        display: 'flex',
        alignItems: 'center',
        gap: isTablet ? '0rem' : '0.5rem',
        marginTop: property[0],
        marginBottom: property[1],
        cursor: 'pointer',
        padding: '0.5rem',
        justifyContent: isTablet ? 'center' : 'flex-start',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
      <Typography
        sx={{
          color: curTheme === 2 ? '#ffffff' : property[2],
          fontWeight: 'medium',
          fontSize: '1.1rem',
        }}
      >
        {isTablet ? null : title}
      </Typography>
    </button>
  );
};

export default AppBarTab;
