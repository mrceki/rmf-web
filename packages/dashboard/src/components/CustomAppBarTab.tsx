import { Typography } from '@mui/material';
import React from 'react';
import { SettingsContext } from './app-contexts';

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

  const isActive = id === activeButton;

  const handleClick = () => {
    onClick(id);
    setActiveButton(id);
  };

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
        gap: '0.5rem',
        marginTop: property[0],
        marginBottom: property[1],
        cursor: 'pointer',
        padding: '0.5rem',
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
        {title}
      </Typography>
    </button>
  );
};

export default AppBarTab;
