import { Typography } from '@mui/material';
import React from 'react';
import { SettingsContext } from './app-contexts';

interface Props {
  border: string;
  color: string;
  children?: React.ReactNode;
  height: string;
  onClick: (id: number) => void;
  radius: string;
  width: string;
  title: string;
  property: string[];
  id: number;
  setActiveButton: (id: number) => void;
  activeButton: number;
}

const AppBarTab: React.FC<Props> = ({
  border,
  color,
  children,
  height,
  onClick,
  radius,
  width,
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
        backgroundColor: isActive ? '#c1c1b4' : color,
        border: border,
        borderRadius: radius,
        height,
        width,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: property[0],
        marginBottom: property[1],
        cursor: 'pointer',
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
