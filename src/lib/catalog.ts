import fs from 'fs';
import path from 'path';
import { Product } from '@/types/jewelry';

let cachedCatalog: Product[] | null = null;

export function getLocalCatalog(): Product[] {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  const jsonPath = path.join(process.cwd(), 'data', 'indexed_catalog.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      cachedCatalog = JSON.parse(raw);
      return cachedCatalog || [];
    } catch (e) {
      console.error('Failed to parse indexed_catalog.json:', e);
    }
  }

  // Fallback to basic candidate_dataset.csv if JSON not built yet
  const csvPath = path.join(process.cwd(), 'data', 'candidate_dataset.csv');
  if (fs.existsSync(csvPath)) {
    try {
      const raw = fs.readFileSync(csvPath, 'utf-8');
      const lines = raw.trim().split('\n').slice(1);
      const fallback: Product[] = lines.map((line) => {
        const [id, product_type, image_file] = line.split(',').map((s) => s.trim());
        return {
          id,
          product_type: product_type as 'Necklace' | 'Earrings',
          image_file,
          image_url: `/api/images/${image_file}`,
          color_palette: [],
        };
      });
      return fallback;
    } catch (e) {
      console.error('Failed to parse candidate_dataset.csv fallback:', e);
    }
  }

  return [];
}
