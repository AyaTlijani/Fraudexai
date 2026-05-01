import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type LimitAlertChannel = 'sms' | 'whatsapp';
export type LimitAlertDeliveryStatus = 'sent' | 'failed';

export interface LimitAlertDispatchInput {
  userId: string;
  userName: string;
  destinationPhone: string;
  transactionId: string;
  transactionAmount: number;
  temporaryLimitAmount: number;
  reason: string;
  sendSms: boolean;
  sendWhatsApp: boolean;
}

export interface LimitAlertDelivery {
  channel: LimitAlertChannel;
  destination: string;
  body: string;
  status: LimitAlertDeliveryStatus;
  providerReference: string;
  dispatchedAt: string;
}

export interface LimitAlertEvent {
  id: string;
  userId: string;
  userName: string;
  transactionId: string;
  transactionAmount: number;
  temporaryLimitAmount: number;
  reason: string;
  deliveries: LimitAlertDelivery[];
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class LimitAlertService {
  private readonly alertsSubject = new BehaviorSubject<LimitAlertEvent[]>([]);
  private readonly dispatchedTransactionKeys = new Set<string>();

  get alerts$(): Observable<LimitAlertEvent[]> {
    return this.alertsSubject.asObservable();
  }

  getAlertsValue(): LimitAlertEvent[] {
    return this.alertsSubject.value;
  }

  dispatchLimitReachedAlert(input: LimitAlertDispatchInput): LimitAlertEvent | null {
    const txKey = `${input.userId}:${input.transactionId}`;
    if (this.dispatchedTransactionKeys.has(txKey)) {
      return null;
    }

    const message = this.buildAlertMessage(input);
    const deliveries: LimitAlertDelivery[] = [];

    if (input.sendSms) {
      deliveries.push(this.createDelivery('sms', input.destinationPhone, message));
    }

    if (input.sendWhatsApp) {
      deliveries.push(this.createDelivery('whatsapp', input.destinationPhone, message));
    }

    if (deliveries.length === 0) {
      return null;
    }

    this.dispatchedTransactionKeys.add(txKey);

    const createdAt = new Date().toISOString();
    const event: LimitAlertEvent = {
      id: `LIMIT-ALERT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      userId: input.userId,
      userName: input.userName,
      transactionId: input.transactionId,
      transactionAmount: input.transactionAmount,
      temporaryLimitAmount: input.temporaryLimitAmount,
      reason: input.reason,
      deliveries,
      createdAt
    };

    this.alertsSubject.next([event, ...this.alertsSubject.value].slice(0, 25));

    console.log('[LIMIT ALERT] SMS/WhatsApp alert dispatched', {
      eventId: event.id,
      transactionId: event.transactionId,
      channels: event.deliveries.map(delivery => delivery.channel),
      at: event.createdAt
    });

    return event;
  }

  private buildAlertMessage(input: LimitAlertDispatchInput): string {
    return [
      '[FraudExia] Spending limit reached.',
      `Transaction ${input.transactionId} for $${input.transactionAmount.toFixed(2)} was blocked.`,
      `Temporary cap: $${input.temporaryLimitAmount.toFixed(2)}.`,
      `Reason: ${input.reason}.`
    ].join(' ');
  }

  private createDelivery(
    channel: LimitAlertChannel,
    destination: string,
    body: string
  ): LimitAlertDelivery {
    const dispatchedAt = new Date().toISOString();
    const providerReference = `${channel.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    return {
      channel,
      destination,
      body,
      status: 'sent',
      providerReference,
      dispatchedAt
    };
  }
}
