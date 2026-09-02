"""
build_index.py - Offline Indexing & Embedding Pipeline for Jewelry Catalog
Processes candidate_dataset.csv + images:
1. Computes CLIP ViT-B/32 512-dim normalized embedding per image.
2. Extracts LAB k-means dominant color palette (with studio background de-weighting).
3. If Supabase credentials are provided in .env / arguments:
   - Uploads images to Supabase Storage bucket 'jewelry-images'
   - Upserts records with pgvector embeddings into 'products' table
4. Generates data/indexed_catalog.json as a local indexed backup and verified cache.
"""

import os
import sys
import csv
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Ensure scripts directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from clip_utils import encode_image
from color_utils import extract_dominant_colors

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CSV_PATH = DATA_DIR / "candidate_dataset.csv"
IMAGES_DIR = DATA_DIR / "images"
OUTPUT_JSON = DATA_DIR / "indexed_catalog.json"

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "jewelry-images")


def get_supabase_client():
    """Initializes Supabase client if credentials are configured."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[WARN] Could not initialize Supabase client: {e}")
        return None


def upload_image_to_supabase(sb, file_path: Path, bucket_name: str) -> str:
    """Uploads image to Supabase Storage and returns public URL."""
    file_name = file_path.name
    try:
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        # Try uploading file
        sb.storage.from_(bucket_name).upload(
            path=file_name,
            file=file_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
    except Exception as e:
        print(f"  Notice during upload for {file_name}: {e}")

    # Retrieve public URL
    try:
        public_url_res = sb.storage.from_(bucket_name).get_public_url(file_name)
        return public_url_res
    except Exception as e:
        print(f"  Could not get public URL: {e}")
        return f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_name}"


def main():
    parser = argparse.ArgumentParser(description="Build Jewelry Index (CLIP + LAB Colors)")
    parser.add_argument("--skip-supabase", action="store_true", help="Skip Supabase upload and save to local JSON only")
    parser.add_argument("--force-recompute", action="store_true", help="Force recomputing embeddings and colors")
    args = parser.parse_args()

    print("=" * 60)
    print("Jewelry Visual-Matching: Offline Indexing Pipeline")
    print(f"Dataset CSV: {CSV_PATH}")
    print(f"Images Dir:  {IMAGES_DIR}")
    print("=" * 60)

    if not CSV_PATH.exists():
        print(f"[ERROR] CSV not found at {CSV_PATH}")
        sys.exit(1)
    if not IMAGES_DIR.exists():
        print(f"[ERROR] Images folder not found at {IMAGES_DIR}")
        sys.exit(1)

    # Initialize Supabase
    sb = None if args.skip_supabase else get_supabase_client()
    if sb:
        print(f"[INFO] Connected to Supabase at {SUPABASE_URL}")
    else:
        print("[INFO] Supabase credentials not found or skipped. Operating in local index build mode.")

    # Read CSV
    records = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append({
                "id": row["id"].strip(),
                "product_type": row["product_type"].strip(),
                "image_file": row["image_file"].strip()
            })

    print(f"Loaded {len(records)} products from catalog.")

    indexed_products = []
    for idx, item in enumerate(records, 1):
        prod_id = item["id"]
        prod_type = item["product_type"]
        image_file = item["image_file"]
        image_path = IMAGES_DIR / image_file

        print(f"[{idx}/{len(records)}] Processing {prod_id} ({prod_type}) - {image_file}...")

        if not image_path.exists():
            print(f"  [ERROR] Image not found: {image_path}")
            continue

        # 1. Compute CLIP embedding (512-dim vector)
        embedding = encode_image(str(image_path))

        # 2. Extract dominant color palette in LAB space
        palette = extract_dominant_colors(str(image_path), k=5)

        # 3. Handle image URL
        image_url = f"/api/images/{image_file}"  # Default local public serving endpoint
        if sb:
            print(f"  Uploading {image_file} to Supabase bucket '{STORAGE_BUCKET}'...")
            sb_url = upload_image_to_supabase(sb, image_path, STORAGE_BUCKET)
            if sb_url:
                image_url = sb_url

        product_data = {
            "id": prod_id,
            "product_type": prod_type,
            "image_file": image_file,
            "image_url": image_url,
            "color_palette": palette,
            "embedding": embedding
        }

        # 4. Upsert to Supabase if connected
        if sb:
            try:
                print(f"  Upserting {prod_id} into Supabase products table...")
                sb.table("products").upsert({
                    "id": prod_id,
                    "product_type": prod_type,
                    "image_file": image_file,
                    "image_url": image_url,
                    "color_palette": palette,
                    "embedding": embedding
                }).execute()
            except Exception as e:
                print(f"  [WARN] Supabase database upsert error for {prod_id}: {e}")

        indexed_products.append(product_data)

    # 5. Write local index cache
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(indexed_products, f, indent=2)

    print("\n" + "=" * 60)
    print(f"Indexing complete! Processed {len(indexed_products)} items.")
    print(f"Local index saved to: {OUTPUT_JSON}")
    print("=" * 60)


if __name__ == "__main__":
    main()
