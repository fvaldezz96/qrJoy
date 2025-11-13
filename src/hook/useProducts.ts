import { useEffect } from 'react';

import {
  fetchProducts,
  selectLoadingByCategory,
  selectProductsByCategory,
} from '../store/slices/productsSlice';
import { useAppDispatch, useAppSelector } from './hook';

export const useProducts = (category: 'all' | 'drink' | 'food' | 'ticket' = 'all') => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProductsByCategory(category));
  const loading = useAppSelector(selectLoadingByCategory(category));

  useEffect(() => {
    dispatch(fetchProducts({ category: category === 'all' ? undefined : category }));
  }, [category, dispatch]);

  return { products, loading };
};
