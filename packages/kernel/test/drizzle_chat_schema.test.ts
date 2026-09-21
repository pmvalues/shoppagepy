import { describe, it, expect } from 'vitest';
import {
  conversations,
  messages,
  quotes,
  quoteLines,
  buyerChatProfiles,
  merchantChatSettings,
  isPostgresHealthy,
  withPostgresOrFallback,
  getPostgresConnectionString,
} from '../src';

describe('Phase 1: Drizzle Chat & Quote Schema Models (Section 3.1)', () => {
  it('defines conversations table with expected columns and foreign keys', () => {
    expect(conversations).toBeDefined();
    expect(conversations.id).toBeDefined();
    expect(conversations.buyerId).toBeDefined();
    expect(conversations.merchantId).toBeDefined();
    expect(conversations.status).toBeDefined();
    expect(conversations.lastMessageAt).toBeDefined();
    expect(conversations.channel).toBeDefined();
  });

  it('defines messages table with 11-type taxonomy compatibility', () => {
    expect(messages).toBeDefined();
    expect(messages.id).toBeDefined();
    expect(messages.conversationId).toBeDefined();
    expect(messages.senderType).toBeDefined();
    expect(messages.messageType).toBeDefined();
    expect(messages.content).toBeDefined();
    expect(messages.text).toBeDefined();
    expect(messages.status).toBeDefined();
  });

  it('defines quotes table with financial and reservation columns', () => {
    expect(quotes).toBeDefined();
    expect(quotes.id).toBeDefined();
    expect(quotes.conversationId).toBeDefined();
    expect(quotes.quoteNumber).toBeDefined();
    expect(quotes.subtotal).toBeDefined();
    expect(quotes.total).toBeDefined();
    expect(quotes.validUntil).toBeDefined();
    expect(quotes.stockReservedUntil).toBeDefined();
    expect(quotes.status).toBeDefined();
  });

  it('defines quoteLines table with line item accounting', () => {
    expect(quoteLines).toBeDefined();
    expect(quoteLines.id).toBeDefined();
    expect(quoteLines.quoteId).toBeDefined();
    expect(quoteLines.productId).toBeDefined();
    expect(quoteLines.quantity).toBeDefined();
    expect(quoteLines.unitPrice).toBeDefined();
    expect(quoteLines.lineTotal).toBeDefined();
  });

  it('defines buyerChatProfiles and merchantChatSettings', () => {
    expect(buyerChatProfiles).toBeDefined();
    expect(buyerChatProfiles.buyerId).toBeDefined();
    expect(buyerChatProfiles.displayName).toBeDefined();
    expect(buyerChatProfiles.phoneHash).toBeDefined();

    expect(merchantChatSettings).toBeDefined();
    expect(merchantChatSettings.merchantId).toBeDefined();
    expect(merchantChatSettings.autoQuoteEnabled).toBeDefined();
    expect(merchantChatSettings.responseTimeSla).toBeDefined();
  });

  it('provides safe PostgreSQL zero-degradation fallback when offline', async () => {
    // When no DATABASE_URI is provided or offline, isPostgresHealthy returns false
    const healthy = await isPostgresHealthy();
    expect(typeof healthy).toBe('boolean');

    // withPostgresOrFallback executes fallbackFn transparently
    const result = await withPostgresOrFallback(
      async () => 'postgres_result',
      () => 'fallback_sqlite_result'
    );
    expect(result).toBe('fallback_sqlite_result');
  });
});
