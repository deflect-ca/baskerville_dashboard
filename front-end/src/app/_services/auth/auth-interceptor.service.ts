import {
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Router} from '@angular/router';
import {shareReplay, tap} from 'rxjs/operators';

// source: https://blog.angular-university.io/angular-jwt-authentication/

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}


  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let request = req;
    const idToken = localStorage.getItem('token');
    if (idToken) {
      request = req.clone({
        headers: req.headers.set('Authorization',
          'Bearer ' + idToken)
      });
    }
    return next.handle(request).pipe(tap(
      () => {},
      (err: any) => {
        console.log('error status', err);
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.router.navigateByUrl('/login');
          }
          return;
        }
      }), shareReplay(1));
  }
}

