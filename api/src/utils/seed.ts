import { connectMongo } from '../config/db';
import { Product, Stock } from '../modules';

async function run() {
  await connectMongo();

  const drinks = await Product.insertMany([
    { name: 'Cerveza', category: 'drink', price: 3000 },
    { name: 'Fernet + Cola', category: 'drink', price: 4500 },
    { name: 'Agua', category: 'drink', price: 1500 },
  ]);

  for (const p of drinks) {
    await Stock.updateOne(
      { productId: p._id, location: 'bar' },
      { $setOnInsert: { quantity: 50, threshold: 10 } },
      { upsert: true },
    );
  }

  console.log('✅ Seed listo.');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
