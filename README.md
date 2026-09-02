# Jewelry Visual-Matching Prototype: Necklace → Matching Earrings Recommender

An AI-powered visual matching and style-pairing prototype engineered for Indian traditional & ethnic jewelry (kundan, polki, temple gold, meenakari, colored gemstones, and silver CZ pieces).

This system takes a selected necklace from catalog inventory (or uploaded photo) and surfaces the top-N visually matching earrings ranked by a hybrid similarity score combining **deep vision embeddings** with **perceptual color harmony**.

---

## 1. Matching Approach & Domain-Specific Styling Logic

Generic image search fails on fine ethnic jewelry because pieces with identical design language (e.g. uncut diamonds / kundan setting) look mismatched if the stones clash (e.g., an emerald-green necklace paired with ruby-red earrings). Conversely, naive color histograms fail because they ignore the intricate silhouettes, filigree metalwork, and jhumka/chandbali motifs.

To solve this, the matching engine uses a two-signal hybrid scoring model:

$$\text{final\_score} = (w_{\text{clip}} \times \text{clip\_score}) + (w_{\text{color}} \times \text{color\_score})$$

- **Default Weights:** $0.6 \times \text{clip\_cosine\_sim} + 0.4 \times \text{color\_similarity}$ (fully configurable via `.env` or the live UI slider).

### Signal 1: Deep Semantic Embedding (CLIP ViT-B/32)
- Encodes structural jewelry characteristics: metal texture, stone cuts (polki, kundan, faceted), motifs (peacock, floral, temple motifs), and silhouette style (choker vs delicate chain).
- Extracted using `open_clip` (`ViT-B-32` pretrained on OpenAI weights) into normalized 512-dimensional vectors.
- Cosine similarity:
  $$\text{clip\_score} = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}$$

### Signal 2: CIE L\*a\*b\* Color Harmony with Background De-weighting
- Traditional Indian jewelry is often photographed on diverse backdrops (light pink satin, beige velvet, dark wood, blue velvet busts, white lightboxes).
- **Background Filtering:** Our pipeline samples corner regions and extreme studio lighting (near-white $L^* > 92$, near-black $L^* < 12$, and backdrop cluster distance) to isolate the actual jewelry foreground.
- **K-Means Clustering:** Extracts $k=5$ dominant color clusters in CIE L\*a\*b\* space (where Euclidean distance corresponds to human perceptual color difference $\Delta E$).
- **Bidirectional Chamfer Matching:** Evaluates whether the necklace's key gemstones and metals (e.g. rich gold $+24\text{k}$, emerald green, pearl ivory) are present in the earrings:
  $$\Delta E_{\text{symmetric}} = \frac{1}{2} \left( \sum_{i} w_i \min_j \| \mathbf{c}_{1,i} - \mathbf{c}_{2,j} \|_2 + \sum_{j} w_j \min_i \| \mathbf{c}_{2,j} - \mathbf{c}_{1,i} \|_2 \right)$$
- Normalized via calibrated exponential decay ($\sigma = 28.0$):
  $$\text{color\_score} = \exp\left(-\frac{\Delta E_{\text{symmetric}}}{28.0}\right)$$

---

## 2. Architecture & Production Alignment

This prototype mirrors the actual enterprise architecture of an AI-powered jewelry retail SaaS:

```
┌────────────────────────────────────────────────────────┐
│                   OFFLINE / BATCH                      │
│                                                        │
│  data/images/ + candidate_dataset.csv                  │
│                        │                               │
│                        ▼                               │
│              scripts/build_index.py                    │
│      ├── open_clip ViT-B/32 (512-dim embedding)        │
│      └── LAB K-Means (de-weighted dominant colors)     │
│                        │                               │
│          ┌─────────────┴──────────────┐                │
│          ▼                            ▼                │
│  Supabase Storage              Supabase Postgres       │
│  ('jewelry-images')           (products + pgvector)    │
└───────────────────────────────────────┬────────────────┘
                                        │
┌───────────────────────────────────────┼────────────────┐
│                   ONLINE / RUNTIME    │                │
│                                       ▼                │
│  Next.js 14/15 App Router (TypeScript + Tailwind CSS)  │
│                                                        │
│  GET /api/necklaces  ──► Fetch catalog necklaces       │
│  GET /api/recommend  ──► pgvector RPC (match_earrings) │
│                          + LAB Delta-E Color Scoring   │
│                          + Hybrid Rank & Sub-scores    │
│                                                        │
│  Luxury Atelier UI:                                    │
│  - Horizontal Necklace Picker Ribbon                   │
│  - Active Piece Inspection (Color Fingerprint)         │
│  - Top-N Ranked Earring Recommendations with Sub-scores│
│  - Interactive Scoring Weight Controls (0-100% tuning) │
└────────────────────────────────────────────────────────┘
```

### Why this stack?
1. **Supabase (Postgres + pgvector + Storage):** Serves as the unified cloud database, high-performance vector search engine (HNSW cosine distance indexing), and global CDN asset storage.
2. **Python Offline Pipeline:** Heavy ML tasks (PyTorch, CLIP transformer inference, K-Means clustering) run asynchronously during catalog ingestion or batch sync, decoupled from customer web traffic.
3. **Next.js App Router:** High-performance, SEO-ready UI with server-side caching and low-latency API routes that query precomputed vector embeddings without running GPU inference at web request time.

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- Python 3.10 or 3.11

### Step 1: Clone & Install Dependencies
```bash
# 1. Install Node.js frontend dependencies
npm install

# 2. Setup Python environment and install pipeline dependencies
py -3.11 -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

pip install -r scripts/requirements.txt
```

### Step 2: Supabase Setup (Postgres + pgvector)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the migration script located at:
   [`supabase/migrations/01_init.sql`](file:///c:/Users/aggis/Desktop/Jwellery_recommendation/supabase/migrations/01_init.sql).
   This script:
   - Enables the `vector` extension.
   - Creates the `products` table with `vector(512)` column.
   - Sets up HNSW vector indexing.
   - Defines the `match_earrings` RPC function.
3. Create a public Storage bucket named `jewelry-images` in your Supabase Dashboard.
4. Copy `.env.example` to `.env.local` and add your project keys:
   ```bash
   cp .env.example .env.local
   ```

### Step 3: Run the Indexing Pipeline
Run `build_index.py` to extract CLIP embeddings, compute color palettes, and upload the catalog:
```bash
python scripts/build_index.py
```
> **Note:** If run without Supabase keys, the script automatically operates in local mode, computing and caching all vectors & palettes to `data/indexed_catalog.json`. The Next.js app will seamlessly load from this verified cache.

### Step 4: Run the Next.js Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. API Endpoints

### `GET /api/necklaces`
Returns all necklaces available in catalog for the picker UI:
```json
{
  "necklaces": [
    {
      "id": "N01",
      "product_type": "Necklace",
      "image_file": "Nck_1.jpg",
      "image_url": "/api/images/Nck_1.jpg",
      "color_palette": [...]
    }
  ],
  "source": "supabase"
}
```

### `GET /api/recommend?necklaceId=N01&clipWeight=0.6&colorWeight=0.4&topN=5`
Returns top ranked earring matches with transparent sub-scores:
```json
{
  "necklace": { "id": "N01", "image_url": "..." },
  "recommendations": [
    {
      "id": "E02",
      "rank": 1,
      "final_score": 0.8842,
      "clip_score": 0.8620,
      "color_score": 0.9175,
      "image_url": "...",
      "color_palette": [...]
    }
  ],
  "scoring_weights": { "clip": 0.6, "color": 0.4 },
  "source": "supabase_pgvector"
}
```

---

## 5. Production Roadmap & SaaS Extensions

1. **Foreground Masking & Segmentation (SAM / Segment Anything):**
   - Replace heuristic background de-weighting with a fine-tuned segmentation model to mask out display busts and velvet pads completely before computing CLIP embeddings.
2. **Learned Re-Ranking via User Feedback:**
   - Incorporate jeweler stylist feedback and customer click-through / add-to-bag telemetry into a LambdaMART or cross-encoder re-ranker.
3. **Customer Image Uploads:**
   - Allow brides and customers to upload their own heirloom necklace photos; execute lightweight client-side or serverless edge embedding via ONNX Runtime Web.
4. **Multimodal LLM Styling Tagging:**
   - Use Gemini 1.5 Flash to automatically extract structured jewelry tags (e.g. `{"metal": "22k yellow gold", "stones": ["emerald", "uncut diamond"], "setting": "jadau kundan", "occasion": "bridal"}`) for hybrid lexical + semantic search filters.
5. **Unified Pure-SQL Supabase RPC:**
   - Port the CIE LAB Delta-E formula directly into a PostgreSQL PL/pgSQL function or custom pgvector extension distance operator, running the entire hybrid score in a single query with sub-10ms response time.
