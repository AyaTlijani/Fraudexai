import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StreamService {

  private socket!: WebSocket;
  private connected = false;

  private streamSubject = new BehaviorSubject<any[]>([]);
  stream$ = this.streamSubject.asObservable();

  private currentSession: string | null = null;

  connect() {

    if (this.connected) return;
    this.connected = true;

    this.socket = new WebSocket('ws://127.0.0.1:8000/stream');

    this.socket.onmessage = (event) => {

      const tx = JSON.parse(event.data);

      if (this.currentSession && this.currentSession !== tx.session) {
        this.streamSubject.next([]);
      }

      this.currentSession = tx.session;

      const current = this.streamSubject.value;

      if (current.some(t => t.tx_id === tx.tx_id && t.session === tx.session)) return;

      this.streamSubject.next([tx, ...current]);
    };

    this.socket.onclose = () => {
      this.connected = false;
    };
  }

  disconnect() {
    this.socket?.close();
    this.connected = false;
  }
}