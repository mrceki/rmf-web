import { Button, Typography, styled } from '@mui/material';
import React from 'react';
import { StubAuthenticator } from '../stub';

const prefix = 'login-card';
const classes = {
  container: `${prefix}-container`,
  title: `${prefix}-title`,
  logo: `${prefix}-logo`,
  button: `${prefix}-button`,
  text: `${prefix}-text`,
  textInput: `${prefix}-textInput`,
  spinner: `${prefix}-spinner`,
  loadingContainer: `${prefix}-loading-container`,
  loadingText: `${prefix}-loading-text`,
};
const StyledDiv = styled('div')(({ theme }) => ({
  [`&.${classes.container}`]: {
    display: 'flex',
    flexDirection: 'column',
    borderStyle: 'none',
    borderRadius: 20,
    borderColor: 'black',
    padding: '70px',
    width: '250px',
    height: '250px',
    minWidth: 250,
    backgroundColor: '#CE172D',
    boxShadow: theme.shadows[12],
    gap: '50px',
  },
  [`& .${classes.title}`]: {
    color: '#ecece7',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  [`& .${classes.logo}`]: {
    width: 100,
    margin: '25px 0px 50px 0px',
  },
  [`& .${classes.button}`]: {
    width: '100px',
    height: '30px',
    borderRadius: '20px',
    backgroundColor: '#ecece7',
    position: 'relative',
    '&:hover': {
      trasform: 'scale(1.5)',
      backgroundColor: '#ecece7',
    },
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  [`& .${classes.text}`]: {
    color: '#CE172D',
    fontsize: '20px',
  },
  [`& .${classes.textInput}`]: {
    width: 'full',
    height: '30px',
    borderRadius: '20px',
    border: 'none',
    padding: '10px',
    fontSize: '15px',
    backgroundColor: '#ecece7',
    outline: 'none',
  },
  [`& .${classes.spinner}`]: {
    top: '50%',
    left: '50%',
    trasform: 'translate(-50%,-50%)',
    border: '3px solid #ecece7',
    borderRadius: '50%',
    borderTop: '3px solid #CE172D',
    width: '20px',
    height: '20px',
    animation: 'spin 2s linear infinite',
    '@keyframes spin': {
      '0%': {
        transform: 'rotate(0deg)',
      },
      '100%': {
        transform: 'rotate(360deg)',
      },
    },
  },
  [`& .${classes.loadingContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    width: '120px',
    height: '40px',
    alignItems: 'center',
    gap: '10px',
  },
  [`& .${classes.loadingText}`]: {
    color: '#CE172D',
    fontSize: '14px',
  },
}));

export interface LoginCardProps extends React.PropsWithChildren<{}> {
  title: string;
  logo: string;
  onLoginClick?: React.MouseEventHandler;
}

export const LoginCard = React.forwardRef(
  (
    { title, logo, onLoginClick, children }: LoginCardProps,
    ref: React.Ref<HTMLDivElement>,
  ): JSX.Element => {
    const [username, setUsername] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleUsernameCheck = (event: React.MouseEvent) => {
      const auth = new StubAuthenticator(username);
      auth.init();
      const resp = auth.login();

      resp.then(
        (value) => {
          setLoading(true);
          setTimeout(() => {
            onLoginClick?.(event);
            setLoading(false);
          }, 2000);
        },
        (error) => {
          alert('Invalid username');
        },
      );
    };
    return (
      <StyledDiv ref={ref} className={classes.container}>
        <Typography variant="h4" className={classes.title}>
          {title}
        </Typography>
        <input
          type="text"
          placeholder="Enter the username"
          className={classes.textInput}
          name="username"
          required
          onChange={(event) => {
            setUsername(event.target.value);
          }}
        />

        {/* <img src="/rmf_demos_ws/src/rmf-web/packages/dashboard/src/assets/defaultLogo.png" /> */}
        <Button className={classes.button} disabled={loading} onClick={handleUsernameCheck}>
          {loading ? (
            <div className={classes.loadingContainer}>
              <div className={classes.spinner}></div>
            </div>
          ) : (
            <Typography className={classes.text}>Login</Typography>
          )}
        </Button>
        {children}
      </StyledDiv>
    );
  },
);

export default LoginCard;
