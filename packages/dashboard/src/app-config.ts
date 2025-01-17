import { Authenticator, KeycloakAuthenticator, StubAuthenticator } from 'rmf-auth';
import ResourceManager from './managers/resource-manager';
import { BasePath } from './util/url';

export interface AppConfig {
  authenticator: Authenticator;
  trajServerUrl: string;
  rmfServerUrl: string;
  appResourcesFactory: () => Promise<ResourceManager | undefined>;
}

export const appConfig: AppConfig = (() => {
  const trajServer = process.env.REACT_APP_TRAJECTORY_SERVER;
  if (!trajServer) {
    throw new Error('REACT_APP_TRAJECTORY_SERVER env variable is needed but not defined');
  }

  const authenticator = (() => {
    if (!process.env.REACT_APP_AUTH_PROVIDER) {
      return new StubAuthenticator();
    }
    // it is important that we do not do any processing on REACT_APP_AUTH_PROVIDER so that webpack
    // can remove dead code, we DO NOT want the output to have the stub authenticator even if
    // it is not used.
    const provider = process.env.REACT_APP_AUTH_PROVIDER;
    switch (provider) {
      case 'keycloak':
        if (!process.env.REACT_APP_KEYCLOAK_CONFIG) {
          throw new Error('missing REACT_APP_KEYCLOAK_CONFIG');
        }
        return new KeycloakAuthenticator(
          JSON.parse(process.env.REACT_APP_KEYCLOAK_CONFIG),
          `${window.location.origin}${BasePath}/silent-check-sso.html`,
        );
      case 'admin':
        return new StubAuthenticator();
      default:
        throw new Error(`unknown auth provider "${provider}"`);
    }
  })();

  if (!process.env.REACT_APP_RMF_SERVER) {
    throw new Error('REACT_APP_RMF_SERVER is required');
  }

  return {
    authenticator,
    appResourcesFactory: ResourceManager.defaultResourceManager,
    trajServerUrl: trajServer,
    rmfServerUrl: process.env.REACT_APP_RMF_SERVER,
  } as AppConfig;
})();

export default appConfig;
