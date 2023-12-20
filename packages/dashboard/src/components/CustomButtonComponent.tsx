import { Typography } from '@mui/material';
import React from 'react';
import { SettingsContext } from './app-contexts';

interface Props {
  border: string;
  color: string;
  children?: React.ReactNode;
  height: string;
  onClick: () => void;
  radius: string;
  width: string;
  title: string;
  property: string[];
}

const Button: React.FC<Props> = ({
  border,
  color,
  children,
  height,
  onClick,
  radius,
  width,
  title,
  property,
}) => {
  const curTheme = React.useContext(SettingsContext).themeMode;
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: color,
        border: border,
        borderRadius: radius,
        height,
        width,
        display: 'flex',
        justifyContent: 'center',
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
        className="newTask"
        sx={{
          color: curTheme === 2 ? '#ffffff' : '#ffffff',
          fontWeight: 'medium',
          fontSize: '1.2rem',
        }}
      >
        {title}
      </Typography>
    </button>
  );
};

export default Button;
