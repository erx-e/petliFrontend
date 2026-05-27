import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface CacheEntry {
  response: HttpResponse<any>;
  expiresAt: number; // momento en que deja de ser "fresca" (timestamp ms)
}

/**
 * Caché en memoria de respuestas GET con:
 * - TTL por entrada (cada respuesta caduca por su cuenta).
 * - Tope de tamaño con desalojo LRU (la menos usada se va primero).
 * - Invalidación granular por recurso (ej. solo "postpet").
 */
@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private store = new Map<string, CacheEntry>();
  private readonly maxEntries = 60;

  /** Devuelve la entrada (fresca o no) o null. No juzga frescura: eso lo decide quien llama. */
  get(key: string): CacheEntry | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    // LRU: al usarla, la reinsertamos al final para marcarla como reciente.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry;
  }

  set(key: string, response: HttpResponse<any>, ttlMs: number) {
    this.store.set(key, { response, expiresAt: Date.now() + ttlMs });
    // Tope LRU: si excede, expulsa la entrada más antigua (primera del Map).
    if (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }

  /** Invalida las entradas cuyo URL contenga `/<resource>` (granular, p. ej. "postpet"). */
  invalidateResource(resource: string) {
    const needle = `/${resource}`;
    for (const key of [...this.store.keys()]) {
      if (key.includes(needle)) this.store.delete(key);
    }
  }

  invalidateAll() {
    this.store.clear();
  }
}
