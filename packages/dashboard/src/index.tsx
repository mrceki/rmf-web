import 'leaflet/dist/leaflet.css';
import ReactDOM from 'react-dom/client';
import { LocalizationProvider } from 'react-components';
import { BrowserRouter } from 'react-router-dom';
import App from './components/app';
import * as serviceWorker from './serviceWorker';
import { I18nextProvider } from 'react-i18next';
import i18n from './components/i18n';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <LocalizationProvider>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nextProvider>
  </LocalizationProvider>,
);

// NOTE: There is no point to have the app work offline as all the data must come from rmf and
// cannot be cached.

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
