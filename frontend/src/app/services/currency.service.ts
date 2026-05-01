import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ExchangeRates {
  amount: number;
  base: string;
  date: string;
  rates: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private baseUrl = 'https://open.er-api.com/v6/latest';

  constructor(private http: HttpClient) {}

  /**
   * Fetch live exchange rates
   */
  getLatestRates(base: string = 'EUR'): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${base}`);
  }

  /**
   * Convert a specific amount between two currencies
   */
  convert(amount: number, from: string, to: string): Observable<number> {
    return this.http.get<any>(`${this.baseUrl}/latest?amount=${amount}&from=${from}&to=${to}`).pipe(
      map(res => res.rates[to])
    );
  }

  /**
   * Get historical rates (optional enhancement)
   */
  getHistoricalRates(date: string, base: string, symbols: string[]): Observable<ExchangeRates> {
    const symbolStr = symbols.join(',');
    return this.http.get<ExchangeRates>(`${this.baseUrl}/${date}?from=${base}&to=${symbolStr}`);
  }
}
