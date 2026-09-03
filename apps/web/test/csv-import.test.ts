import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  validateMerchantRows,
  validateProductRows,
} from '../src/lib/csv-import';

describe('@shoppage/web CSV import', () => {
  describe('parseCsv', () => {
    it('parses headers plus rows', () => {
      const rows = parseCsv('a,b,c\n1,2,3\n4,5,6');
      expect(rows).toEqual([
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        ['4', '5', '6'],
      ]);
    });

    it('handles quoted commas, escaped quotes and CRLF', () => {
      const rows = parseCsv('title,note\r\n"Hello, world","say ""hi"""\r\nplain,ok\r\n');
      expect(rows).toEqual([
        ['title', 'note'],
        ['Hello, world', 'say "hi"'],
        ['plain', 'ok'],
      ]);
    });

    it('handles multiline quoted fields and skips blank lines', () => {
      const rows = parseCsv('a,b\n"line1\nline2",x\n\n,,\n');
      expect(rows).toEqual([
        ['a', 'b'],
        ['line1\nline2', 'x'],
      ]);
    });
  });

  describe('validateMerchantRows', () => {
    it('accepts valid rows with defaults', () => {
      const res = validateMerchantRows([
        ['name', 'address', 'province'],
        ['Test Store', '123 Main Rd', 'Gauteng'],
      ]);
      expect(res.total).toBe(1);
      expect(res.valid.length).toBe(1);
      expect(res.errors.length).toBe(0);
      expect(res.valid[0].category).toBe('wholesale');
      expect(res.valid[0].whatsapp).toBe('');
    });

    it('rejects rows missing name or address', () => {
      const res = validateMerchantRows([
        ['name', 'address'],
        ['', 'Somewhere'],
        ['No Address', ''],
      ]);
      expect(res.valid.length).toBe(0);
      expect(res.errors.length).toBe(2);
      expect(res.errors[0].row).toBe(2);
    });
  });

  describe('validateProductRows', () => {
    const exists = (id: string) => id === 'loc_test_store';

    it('accepts valid rows', () => {
      const res = validateProductRows(
        [
          ['title', 'merchantId', 'price', 'brand'],
          ['Deye 5kW', 'loc_test_store', '19850', 'Deye'],
        ],
        exists,
      );
      expect(res.valid.length).toBe(1);
      expect(res.valid[0].price).toBe(19850);
      expect(res.errors.length).toBe(0);
    });

    it('rejects unknown merchants, bad prices and missing titles', () => {
      const res = validateProductRows(
        [
          ['title', 'merchantId', 'price'],
          ['No Merchant', 'loc_ghost', '100'],
          ['Bad Price', 'loc_test_store', 'free'],
          ['', 'loc_test_store', '100'],
        ],
        exists,
      );
      expect(res.valid.length).toBe(0);
      expect(res.errors.length).toBe(3);
      expect(res.errors[0].messages[0]).toContain('unknown merchantId');
    });
  });
});
