import { Typography } from '@mui/material';
import React from 'react';
import { SettingsContext } from './app-contexts';
import { useMediaQuery } from 'react-responsive';

interface Props {
  border: string;
  color: string;
  children?: React.ReactNode;
  onClick: () => void;
  radius: string;
  title: string;
  property: string[];
}

const Button: React.FC<Props> = ({
  border,
  color,
  children,

  onClick,
  radius,

  title,
  property,
}) => {
  const curTheme = React.useContext(SettingsContext).themeMode;
  const isTablet = useMediaQuery({ query: '(max-width: 1224px) and (min-height: 500px)' });

  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: color,
        border: border,
        borderRadius: radius,
        padding: '0.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isTablet ? '0rem' : '0.5rem',
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
        {isTablet ? null : title}
      </Typography>
    </button>
  );
};

export default Button;
