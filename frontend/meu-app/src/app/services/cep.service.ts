import { isPlatformBrowser } from '@angular/common';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');

  consultar(cep: string): Observable<HttpResponse<string>> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Consulta disponível apenas no navegador.'));
    }

    const normalized = cep.replace(/\D/g, '');
    const url = `${this.apiUrl}/cep/${normalized}`;

    return this.http
      .get(url, {
        observe: 'response',
        responseType: 'text',
      })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const body =
            typeof err.error === 'string'
              ? err.error
              : err.error
                ? JSON.stringify(err.error)
                : '';

          return of(
            new HttpResponse({
              body,
              status: err.status || 0,
              statusText: err.statusText,
              url: err.url ?? url,
            }),
          );
        }),
      );
  }
}
