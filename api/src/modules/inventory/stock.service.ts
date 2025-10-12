// src/modules/stock/stock.service.ts
import { Types } from 'mongoose';

import { Stock } from './stock.model';

type Locations = 'bar' | 'restaurant' | 'door';

export async function ensureStockForProduct(
  productId: string | Types.ObjectId,
  initial?: Partial<Record<Locations, number>>,
) {
  const locations: Locations[] = ['bar', 'restaurant', 'door'];

  const ops = locations.map(loc =>
    Stock.updateOne(
      { productId, location: loc },
      { $setOnInsert: { quantity: initial?.[loc] ?? 0 } },
      { upsert: true },
    ),
  );

  await Promise.all(ops);
}
