export type ImportCollection = 'merchants' | 'products';

export interface ImportRowIssue {
  row: number;
  messages: string[];
}

export interface ValidatedMerchantRow {
  name: string;
  addressText: string;
  province: string;
  category: string;
  telephone: string;
  whatsapp: string;
  email: string;
  website?: string;
}

export interface ValidatedProductRow {
  title: string;
  merchantId: string;
  price: number;
  brand: string;
  category: string;
  sku: string;
  stockQty: number;
  description: string;
  warranty: string;
  specs: string;
  featuredImage: string;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      pushField();
    } else if (c === '\r') {
      continue;
    } else if (c === '\n') {
      pushRow();
    } else {
      field += c;
    }
  }
  pushField();
  if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function headerIndex(header: string[], names: string[]): number {
  const lowered = header.map((h) => h.trim().toLowerCase());
  for (const n of names) {
    const idx = lowered.indexOf(n);
    if (idx !== -1) return idx;
  }
  return -1;
}

function cell(row: string[], idx: number): string {
  return idx === -1 || idx >= row.length ? '' : row[idx].trim();
}

function parsePrice(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw.replace(/r\s*/i, '').replace(/,/g, '').trim());
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export interface ValidationResult<T> {
  valid: T[];
  errors: ImportRowIssue[];
  total: number;
}

export function validateMerchantRows(rows: string[][]): ValidationResult<ValidatedMerchantRow> {
  const valid: ValidatedMerchantRow[] = [];
  const errors: ImportRowIssue[] = [];
  if (rows.length === 0) return { valid, errors, total: 0 };
  const header = rows[0];
  const ix = {
    name: headerIndex(header, ['name', 'store', 'store name', 'trading name']),
    address: headerIndex(header, ['address', 'addresstext', 'address text', 'location']),
    province: headerIndex(header, ['province']),
    category: headerIndex(header, ['category']),
    telephone: headerIndex(header, ['telephone', 'phone', 'tel']),
    whatsapp: headerIndex(header, ['whatsapp', 'whatsapp number']),
    email: headerIndex(header, ['email', 'e-mail']),
    website: headerIndex(header, ['website', 'web', 'url']),
  };
  rows.slice(1).forEach((row, i) => {
    const lineNo = i + 2;
    const messages: string[] = [];
    const name = cell(row, ix.name);
    const addressText = cell(row, ix.address);
    if (!name) messages.push('missing required column: name');
    if (!addressText) messages.push('missing required column: address');
    if (messages.length > 0) {
      errors.push({ row: lineNo, messages });
      return;
    }
    valid.push({
      name,
      addressText,
      province: cell(row, ix.province) || 'Gauteng',
      category: cell(row, ix.category) || 'wholesale',
      telephone: cell(row, ix.telephone),
      whatsapp: cell(row, ix.whatsapp) || cell(row, ix.telephone),
      email: cell(row, ix.email),
      website: cell(row, ix.website) || undefined,
    });
  });
  return { valid, errors, total: rows.length - 1 };
}

export function validateProductRows(
  rows: string[][],
  merchantExists: (id: string) => boolean,
): ValidationResult<ValidatedProductRow> {
  const valid: ValidatedProductRow[] = [];
  const errors: ImportRowIssue[] = [];
  if (rows.length === 0) return { valid, errors, total: 0 };
  const header = rows[0];
  const ix = {
    title: headerIndex(header, ['title', 'name', 'product', 'product title']),
    merchant: headerIndex(header, ['merchantid', 'merchant id', 'merchant', 'store id']),
    price: headerIndex(header, ['price', 'pricezar', 'price (zar)', 'amount']),
    brand: headerIndex(header, ['brand']),
    category: headerIndex(header, ['category']),
    sku: headerIndex(header, ['sku', 'code']),
    stock: headerIndex(header, ['stockqty', 'stock', 'stock qty', 'quantity', 'qty']),
    description: headerIndex(header, ['description', 'desc']),
    warranty: headerIndex(header, ['warranty']),
    specs: headerIndex(header, ['specs', 'specifications']),
    image: headerIndex(header, ['image', 'featuredimage', 'featured image', 'imageurl', 'image url']),
  };
  rows.slice(1).forEach((row, i) => {
    const lineNo = i + 2;
    const messages: string[] = [];
    const title = cell(row, ix.title);
    const merchantId = cell(row, ix.merchant);
    const price = parsePrice(cell(row, ix.price));
    if (!title) messages.push('missing required column: title');
    if (!merchantId) messages.push('missing required column: merchantId');
    else if (!merchantExists(merchantId)) messages.push(`unknown merchantId '${merchantId}' (import merchants first)`);
    if (price === undefined) messages.push('price must be a number >= 0');
    if (messages.length > 0) {
      errors.push({ row: lineNo, messages });
      return;
    }
    valid.push({
      title,
      merchantId,
      price: price as number,
      brand: cell(row, ix.brand) || 'Independent',
      category: cell(row, ix.category) || 'general',
      sku: cell(row, ix.sku),
      stockQty: Math.max(0, parseInt(cell(row, ix.stock) || '0', 10) || 0),
      description: cell(row, ix.description),
      warranty: cell(row, ix.warranty),
      specs: cell(row, ix.specs),
      featuredImage: cell(row, ix.image),
    });
  });
  return { valid, errors, total: rows.length - 1 };
}

export const PRODUCT_CSV_TEMPLATE =
  'title,merchantId,price,brand,category,sku,stockQty,description,warranty,specs,featuredImage\n' +
  '"Deye 5kW Hybrid Inverter",loc_sunpower_crownmines,19850,Deye,solar_energy,SUN-5K-SG03LP1-EU,12,"5kW single phase hybrid inverter","5-year warranty","48V · IP65",\n';

export const MERCHANT_CSV_TEMPLATE =
  'name,address,province,category,telephone,whatsapp,email,website\n' +
  '"SolarBros Test Store","123 Rivonia Rd, Sandton",Gauteng,solar_energy,+27110000000,+27110000000,store@example.co.za,\n';
