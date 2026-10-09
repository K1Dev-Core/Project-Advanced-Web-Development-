import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, PageMeta, Paged } from '../models/common.model';
import { ApiError } from './api-error';

type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiBaseUrl;

  async get<T>(path: string, query?: Query): Promise<T> {
    return (await this.envelope<T>('GET', path, undefined, query)).data;
  }

  async page<T>(path: string, query?: Query): Promise<Paged<T>> {
    const body = await this.envelope<T[]>('GET', path, undefined, query);
    return { items: body.data, meta: body.meta as unknown as PageMeta };
  }

  async envelopeOf<T>(path: string, query?: Query): Promise<ApiEnvelope<T>> {
    return this.envelope<T>('GET', path, undefined, query);
  }

  async post<T>(path: string, body: unknown = {}, query?: Query): Promise<T> {
    return (await this.envelope<T>('POST', path, body, query)).data;
  }

  async postEnvelope<T>(path: string, body: unknown = {}): Promise<ApiEnvelope<T>> {
    return this.envelope<T>('POST', path, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return (await this.envelope<T>('PATCH', path, body)).data;
  }

  async delete<T>(path: string, query?: Query): Promise<T> {
    return (await this.envelope<T>('DELETE', path, undefined, query)).data;
  }

  private async envelope<T>(method: string, path: string, body?: unknown, query?: Query): Promise<ApiEnvelope<T>> {
    try {
      return await firstValueFrom(
        this.http.request<ApiEnvelope<T>>(method, this.baseUrl + path, {
          body,
          params: ApiClient.params(query),
        }),
      );
    } catch (error) {
      throw ApiError.from(error);
    }
  }

  private static params(query?: Query): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
