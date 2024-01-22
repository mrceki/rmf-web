import EventEmitter from 'eventemitter3';
import { Authenticator, AuthenticatorEventType } from './authenticator';

const allowedUsers = ['admin', 'ufuk'];
export class StubAuthenticator
  extends EventEmitter<AuthenticatorEventType>
  implements Authenticator
{
  readonly user: string;

  readonly token?: string;

  constructor(user = 'admin', token: string | undefined = undefined) {
    super();
    this.user = user;
    this.token = token;
  }

  init(): Promise<void> {
    return Promise.resolve();
  }

  login(): Promise<void> {
    // check if user is allowed
    if (allowedUsers.includes(this.user)) {
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  }

  logout(): Promise<never> {
    throw new Error('not supported');
  }

  refreshToken(): Promise<void> {
    return Promise.resolve();
  }
}

export default StubAuthenticator;
