import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Envelop, Results, User, UserCategoryEnum} from '../_models/models';
import {BehaviorSubject} from 'rxjs';
import {environment} from '../../environments/environment';
import {shareReplay, tap} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser: User;
  private currentUserChanged;
  public currentUserChanged$;
  users = new Results();
  usersBehaviorSubj = new BehaviorSubject(this.users);

  constructor(private http: HttpClient) {
    this.currentUserChanged = new BehaviorSubject<any>(this.currentUser);
    this.currentUserChanged$ = this.currentUserChanged.asObservable();
  }
  setUser(user: User): void {
    this.currentUser = user;
    this.currentUserChanged.next(user ? user.email : 'test');
  }
  getUser(): User | any {
    if (this.currentUser === undefined) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        this.currentUser = new User(JSON.parse(savedUser));
      }
    }
    return this.currentUser;
  }
  userIsAdmin(): boolean {
    const user = this.getUser();
    return user ? user.category === UserCategoryEnum.admin : false;
  }
  userIsGuest(): boolean {
    const user = this.getUser();
    return user ? user.category === UserCategoryEnum.guest : false;
  }
  getAllUsers(): any {
    return this.http.get<Envelop>(environment.baseApiUrl + '/users').pipe(shareReplay());
  }
  getUserCategories(): any {
    return this.http.get<Envelop>(environment.baseApiUrl + '/users/categories').pipe(shareReplay());
  }
  getUserById(id: number): any {
    const url = environment.baseApiUrl + '/admin/users/' + id;
    return this.http.get<Envelop>(url)
      .pipe(tap(res => console.info('Got user:', res)), shareReplay(1));
  }
  getUserProfileByUserId(id: number): any {
    const url = environment.baseApiUrl +  + `/users/${id}/profile`;
    return this.http.get<Envelop>(url)
      .pipe(tap(res => this.setUser), shareReplay(1));
  }
  createUser(userData): any {
    return this.http.post<Envelop>(environment.baseApiUrl + '/admin/users', userData)
      .pipe(tap(res => console.info('Created user:', res), shareReplay(1)));
  }
  updateUser(userData): any {
    return this.http.put<Envelop>(environment.baseApiUrl + `/admin/users/${userData['id']}`, userData)
      .pipe(tap(res => console.info('Updated user:', res)), shareReplay(1));
  }
  activateUser(id): any {
    return this.http.post<Envelop>(environment.baseApiUrl + `/admin/users/${id}/activate`, {}).pipe(shareReplay());
  }
  deactivateUser(id): any {
    return this.http.post<Envelop>(environment.baseApiUrl + `/admin/users/${id}/deactivate`, {}).pipe(shareReplay());
  }
  deleteUser(id): any {
    return this.http.post<Envelop>(environment.baseApiUrl + `/admin/users/${id}/delete`, {}).pipe(shareReplay());
  }
}

