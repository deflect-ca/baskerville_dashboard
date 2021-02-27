import {Injectable, Output} from '@angular/core';
import {Envelop, User} from '../../_models/models';
import {environment} from '../../../environments/environment';
import {tap, shareReplay} from 'rxjs/operators';
import * as moment from 'moment';
import {EventEmitter} from '@angular/core';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {UserService} from '../user.service';
import jwtDecode from 'jwt-decode';
// import { tokenNotExpired } from 'angular2-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Observable string sources
  private _user = null;
  @Output() onUserUpdated = new EventEmitter();
  public currentUser = new Subject<User>();

  // Observable string streams
  currentUser$ = this.currentUser.asObservable();
  // Observable string sources
  private emitChangeSource = new Subject<any>();
  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();
  // Service message commands
  emitChange(change: any): any {
    this.emitChangeSource.next(change);
  }

  constructor(private http: HttpClient, private userSvc: UserService) {
  }
  public getToken(): string {
    return localStorage.getItem('token');
  }
  public isAuthenticated(): boolean {
    const token = this.getToken();
    // todo: tokenNotExpired
    return jwtDecode(token);
  }

  public setSession(authResult): void {
    console.warn('authResult', authResult);
    const expiresAt = moment().add(authResult.expiresIn, 'second');

    localStorage.setItem('token', authResult.token);
    localStorage.setItem('currentUser', JSON.stringify(authResult));
    localStorage.setItem('expires_at', JSON.stringify(expiresAt.valueOf()) );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('expires_at');
    this._user = undefined;
    this.userSvc.setUser(this._user);
  }
  login(email: string, password: string ): any {
    const data =   {
      data: {
        email,
        password
      }
    };
    return this.http.post<Envelop>(environment.baseApiUrl + '/login', data).pipe(tap(
      res => this.setSession(res)
    ), shareReplay());
  }
  setUpOrg(orgUUID: string, baskervilleHost: string ): any {
    const data =   {
      data: {
        orgUUID,
        baskervilleHost
      }
    };
    return this.http.post<Envelop>(environment.baseApiUrl + '/organization/register', data).pipe(tap(
      res => this.setSession(res)
    ), shareReplay());
  }
  continueAsGuest(): any {
    return this.http.post<Envelop>(environment.baseApiUrl + `/login/guest`, {}).pipe(tap(
      res => this.setSession(res)
    ), shareReplay());
  }
}
