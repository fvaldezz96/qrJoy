import { connectMongo } from '../config/db';
import { Stock, Table } from '../modules';
import { Product } from '../modules/products/product.model';

async function run() {
  await connectMongo();

  // Mesas
  await Table.updateOne(
    { name: 'Mesa 1' },
    { $setOnInsert: { capacity: 4, active: true } },
    { upsert: true },
  );
  await Table.updateOne(
    { name: 'Mesa 2' },
    { $setOnInsert: { capacity: 4, active: true } },
    { upsert: true },
  );
  await Table.updateOne(
    { name: 'Barra 1' },
    { $setOnInsert: { capacity: 2, active: true } },
    { upsert: true },
  );

  // Productos
  const [beer] = await Product.create(
    [{ name: 'Cerveza', category: 'drink', price: 3000, active: true }],
    { ordered: false },
  );
  const [fernet] = await Product.create(
    [{ name: 'Fernet + Cola', category: 'drink', price: 4500, active: true }],
    { ordered: false },
  );
  const [ticket] = await Product.create(
    [{ name: 'Entrada General', category: 'ticket', price: 6000, active: true }],
    { ordered: false },
  );

  // Stock
  const upsertStock = (productId: any, location: 'bar' | 'restaurant' | 'door', quantity: number) =>
    Stock.updateOne(
      { productId, location },
      { $setOnInsert: { quantity, threshold: 10 } },
      { upsert: true },
    );

  await upsertStock(beer._id, 'bar', 80);
  await upsertStock(fernet._id, 'bar', 50);
  await upsertStock(ticket._id, 'door', 100);

  console.log('✅ seed setup listo');
  process.exit(0);
}
run().catch(e => (console.error(e), process.exit(1)));
