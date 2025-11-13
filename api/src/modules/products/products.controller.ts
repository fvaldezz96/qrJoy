import { Request, Response } from 'express';
import { z } from 'zod';

import { fail, ok } from '../../core';
import { asyncHandler } from '../../utils/asyncHandler';
import { ensureStockForProduct } from '../inventory/stock.service';
import { Product } from './product.model';
/* ===========================
 * ZOD SCHEMAS
 * =========================== */
const IdParam = z.object({ id: z.string().min(1) });

const UpsertDto = z.object({
  name: z.string().min(2),
  category: z.enum(['drink', 'food', 'ticket']),
  price: z.number().nonnegative(),
  active: z.boolean().default(true),
  sku: z.string().optional(),
  imageUrl: z.string().url().optional(),
  initialStock: z
    .object({
      bar: z.number().nonnegative().optional(),
      restaurant: z.number().nonnegative().optional(),
      door: z.number().nonnegative().optional(),
    })
    .optional(),
});

const PartialUpdateDto = UpsertDto.partial();

const ListQueryDto = z.object({
  q: z.string().optional(),
  category: z.enum(['drink', 'food', 'ticket']).optional(),
  active: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z
    .enum(['name', '-name', 'price', '-price', 'createdAt', '-createdAt'])
    .default('-createdAt'),
});

/* ===========================
 * LIST / SEARCH (con filtros + paginación)
 * GET /products
 * =========================== */
export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, active, minPrice, maxPrice, page, limit, sort } = ListQueryDto.parse(
    req.query,
  );

  const filter: any = {};
  if (typeof active === 'boolean') filter.active = active;
  if (category) filter.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (q) {
    filter.$or = [{ name: { $regex: q, $options: 'i' } }, { sku: { $regex: q, $options: 'i' } }];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort.replace(/^-/, '')).sort(sort).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json(
    ok({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }),
  );
});

/* ===========================
 * GET ONE
 * GET /products/:id
 * =========================== */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = IdParam.parse(req.params);
  const doc = await Product.findById(id).lean();
  if (!doc) return res.status(404).json(fail('Producto no encontrado', 'NOT_FOUND'));
  res.json(ok(doc));
});

/* ===========================
 * CREATE
 * POST /products
 * =========================== */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = UpsertDto.parse(req.body);

  const exists =
    (await Product.exists({ name: body.name })) ||
    (body.sku ? await Product.exists({ sku: body.sku }) : null);

  if (exists) return res.status(409).json(fail('Producto duplicado (name/sku)', 'CONFLICT'));

  // Crear el producto
  const doc = await Product.create(body);

  // 🔹 Crear espacios de stock para este producto
  await ensureStockForProduct(doc._id, body.initialStock);

  res.status(201).json(ok(doc));
});

/* ===========================
 * UPDATE (full o parcial)
 * PUT /products/:id  (full)
 * PATCH /products/:id (parcial)
 * =========================== */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = IdParam.parse(req.params);
  const body = UpsertDto.parse(req.body);
  const doc = await Product.findByIdAndUpdate(id, body, { new: true });
  if (!doc) return res.status(404).json(fail('Producto no encontrado', 'NOT_FOUND'));
  res.json(ok(doc));
});

export const patchProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = IdParam.parse(req.params);
  const body = PartialUpdateDto.parse(req.body);
  const doc = await Product.findByIdAndUpdate(id, { $set: body }, { new: true });
  if (!doc) return res.status(404).json(fail('Producto no encontrado', 'NOT_FOUND'));
  res.json(ok(doc));
});

/* ===========================
 * SOFT DELETE / RESTORE
 * DELETE /products/:id         -> active=false
 * POST   /products/:id/restore -> active=true
 * =========================== */
export const softDeleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = IdParam.parse(req.params);
  const doc = await Product.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
  if (!doc) return res.status(404).json(fail('Producto no encontrado', 'NOT_FOUND'));
  res.json(ok(doc));
});

export const restoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = IdParam.parse(req.params);
  const doc = await Product.findByIdAndUpdate(id, { $set: { active: true } }, { new: true });
  if (!doc) return res.status(404).json(fail('Producto no encontrado', 'NOT_FOUND'));
  res.json(ok(doc));
});

/* ===========================
 * HARD DELETE (opcional)
 * DELETE /products/:id?force=true
 * =========================== */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = IdParam.parse(req.params);
  const force = String(req.query.force || '') === 'true';
  if (!force) {
    // por defecto, soft delete
    const soft = await Product.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
    if (!soft) return res.status(404).json(fail('Producto no encontrado', 'NOT_FOUND'));
    return res.json(ok(soft));
  }
  const del = await Product.findByIdAndDelete(id);
  if (!del) return res.status(404).json(fail('Producto no encontrado', 'NOT_FOUND'));
  res.json(ok({ deleted: id }));
});
