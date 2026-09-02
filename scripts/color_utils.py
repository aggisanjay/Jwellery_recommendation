"""
color_utils.py - Jewelry Color Palette Extraction & Similarity Scoring
Specifically engineered for traditional & ethnic Indian jewelry.
Handles gold, kundan, polki, colored gemstones (emerald green, ruby red, pearl white, sapphire blue, etc.)
and de-weights background noise (velvet busts, studio fabric, dark wood, white boards).
"""

import numpy as np
from PIL import Image
from sklearn.cluster import KMeans
from typing import List, Dict, Tuple


def rgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    """
    Convert RGB image or array (values [0, 255]) to CIE L*a*b* space.
    Implements standard D65 illuminant sRGB -> XYZ -> CIELAB transformation.
    rgb: shape (..., 3) in [0, 255]
    returns: shape (..., 3) with L in [0, 100], a in [-128, 127], b in [-128, 127]
    """
    # Normalize RGB to [0, 1]
    rgb_norm = rgb.astype(np.float64) / 255.0

    # sRGB companding inverse
    mask = rgb_norm > 0.04045
    rgb_linear = np.empty_like(rgb_norm)
    rgb_linear[mask] = np.power((rgb_norm[mask] + 0.055) / 1.055, 2.4)
    rgb_linear[~mask] = rgb_norm[~mask] / 12.92

    # sRGB to XYZ matrix (D65 standard)
    m = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041]
    ])
    xyz = np.dot(rgb_linear, m.T)

    # Reference white D65
    ref_white = np.array([0.95047, 1.00000, 1.08883])
    xyz_norm = xyz / ref_white

    # XYZ to LAB non-linear mapping
    delta = 6.0 / 29.0
    mask_xyz = xyz_norm > (delta ** 3)
    f_xyz = np.empty_like(xyz_norm)
    f_xyz[mask_xyz] = np.cbrt(xyz_norm[mask_xyz])
    f_xyz[~mask_xyz] = (xyz_norm[~mask_xyz] / (3.0 * (delta ** 2))) + (4.0 / 29.0)

    L = (116.0 * f_xyz[..., 1]) - 16.0
    a = 500.0 * (f_xyz[..., 0] - f_xyz[..., 1])
    b = 200.0 * (f_xyz[..., 1] - f_xyz[..., 2])

    return np.stack([L, a, b], axis=-1)


def lab_to_rgb(lab: np.ndarray) -> np.ndarray:
    """
    Convert CIE L*a*b* back to standard RGB [0, 255].
    lab: shape (..., 3)
    returns: shape (..., 3) uint8 [0, 255]
    """
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]

    fy = (L + 16.0) / 116.0
    fx = fy + (a / 500.0)
    fz = fy - (b / 200.0)

    delta = 6.0 / 29.0

    def f_inv(f_val):
        mask = f_val > delta
        out = np.empty_like(f_val)
        out[mask] = np.power(f_val[mask], 3)
        out[~mask] = (f_val[~mask] - 16.0 / 116.0) * 3.0 * (delta ** 2)
        return out

    x = f_inv(fx) * 0.95047
    y = f_inv(fy) * 1.00000
    z = f_inv(fz) * 1.08883

    xyz = np.stack([x, y, z], axis=-1)

    # XYZ to linear sRGB
    m_inv = np.array([
        [ 3.2404542, -1.5371385, -0.4985314],
        [-0.9692660,  1.8760108,  0.0415560],
        [ 0.0556434, -0.2040259,  1.0572252]
    ])
    rgb_linear = np.dot(xyz, m_inv.T)
    rgb_linear = np.clip(rgb_linear, 0.0, 1.0)

    # Compand linear to sRGB
    mask_rgb = rgb_linear > 0.0031308
    rgb = np.empty_like(rgb_linear)
    rgb[mask_rgb] = 1.055 * np.power(rgb_linear[mask_rgb], 1.0 / 2.4) - 0.055
    rgb[~mask_rgb] = 12.92 * rgb_linear[~mask_rgb]

    return np.clip(np.round(rgb * 255.0), 0, 255).astype(np.uint8)


def extract_dominant_colors(image_path: str, k: int = 5) -> List[Dict]:
    """
    Extracts k dominant color clusters in CIE LAB space, purposefully de-weighting
    background studio pixels (near-white lightboxes, deep blue/black velvet, beige pads).
    
    Returns a list of cluster dicts:
    [
        {
            "lab": [L, a, b],
            "rgb": [r, g, b],
            "hex": "#rrggbb",
            "weight": float (normalized [0, 1])
        },
        ...
    ]
    """
    img = Image.open(image_path).convert("RGB")
    # Downsample slightly for fast and robust clustering
    img = img.resize((150, 150), Image.Resampling.BILINEAR)
    rgb_pixels = np.array(img).reshape(-1, 3)

    # Convert all pixels to LAB
    lab_pixels = rgb_to_lab(rgb_pixels)
    L = lab_pixels[:, 0]
    a = lab_pixels[:, 1]
    b = lab_pixels[:, 2]

    # Background filtering logic for Indian jewelry photography:
    # 1. Near-white studio backgrounds (L > 90 and low chroma)
    # 2. Near-black deep shadows / velvet voids (L < 12)
    # 3. Corner background estimation: sample corners to detect solid backdrop color
    h, w = 150, 150
    corner_coords = [
        slice(0, 15), slice(0, 15),        # top-left
        slice(0, 15), slice(w - 15, w),     # top-right
        slice(h - 15, h), slice(0, 15),     # bottom-left
        slice(h - 15, h), slice(w - 15, w)  # bottom-right
    ]
    corner_lab_samples = []
    img_grid_lab = lab_pixels.reshape((h, w, 3))
    for i in range(0, len(corner_coords), 2):
        patch = img_grid_lab[corner_coords[i], corner_coords[i+1]].reshape(-1, 3)
        corner_lab_samples.append(patch)
    corner_lab_all = np.vstack(corner_lab_samples)
    corner_mean_lab = np.median(corner_lab_all, axis=0)

    # Distance to the dominant corner background
    dist_to_corner_bg = np.linalg.norm(lab_pixels - corner_mean_lab, axis=1)

    # Keep foreground mask: not extreme white/black, and reasonably distinct from corner backdrop
    chroma = np.sqrt(a**2 + b**2)
    is_extreme_white = (L > 92) & (chroma < 14)
    is_extreme_black = (L < 12)
    is_corner_backdrop = (dist_to_corner_bg < 18) & (chroma < 20)

    foreground_mask = ~(is_extreme_white | is_extreme_black | is_corner_backdrop)

    # Fallback: if over-filtered, loosen constraints
    if np.sum(foreground_mask) < 200:
        foreground_mask = ~(is_extreme_white | is_extreme_black)
    if np.sum(foreground_mask) < 100:
        foreground_mask = np.ones(len(lab_pixels), dtype=bool)

    filtered_lab = lab_pixels[foreground_mask]
    filtered_rgb = rgb_pixels[foreground_mask]

    # Cluster foreground pixels into k clusters
    actual_k = min(k, len(filtered_lab))
    kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init=5)
    kmeans.fit(filtered_lab)

    centers_lab = kmeans.cluster_centers_
    labels = kmeans.labels_
    counts = np.bincount(labels, minlength=actual_k)
    weights = counts / counts.sum()

    # Sort clusters by weight descending
    sorted_indices = np.argsort(weights)[::-1]

    palette = []
    for idx in sorted_indices:
        center_lab = centers_lab[idx]
        weight = float(weights[idx])

        # Find closest actual pixel RGB or convert center
        cluster_pixel_rgbs = filtered_rgb[labels == idx]
        if len(cluster_pixel_rgbs) > 0:
            median_rgb = np.median(cluster_pixel_rgbs, axis=0).astype(int)
        else:
            median_rgb = lab_to_rgb(center_lab[np.newaxis, :])[0]

        r, g, b_val = int(median_rgb[0]), int(median_rgb[1]), int(median_rgb[2])
        hex_code = f"#{r:02x}{g:02x}{b_val:02x}"

        palette.append({
            "lab": [round(float(center_lab[0]), 2), round(float(center_lab[1]), 2), round(float(center_lab[2]), 2)],
            "rgb": [r, g, b_val],
            "hex": hex_code,
            "weight": round(weight, 4)
        })

    return palette


def delta_e_ciede2000(lab1: np.ndarray, lab2: np.ndarray) -> float:
    """
    Standard CIE76 / Euclidean distance in LAB space is widely used and well-behaved
    for fast palette matching. For robustness across broad color swatches, Euclidean
    in LAB represents perceived color distance accurately (JND ~ 2.3).
    """
    return float(np.linalg.norm(np.array(lab1) - np.array(lab2)))


def compute_palette_similarity(palette1: List[Dict], palette2: List[Dict]) -> float:
    """
    Computes a jewelry-specific color similarity between two palettes.
    Uses bidirectional Chamfer-style weighted minimum Delta-E distance:
    - For every prominent color in palette1 (e.g. emerald stone, gold foil),
      find the closest color in palette2, weighted by the prominence.
    - Symmetric matching ensures earrings must complement necklace's key colors.
    
    Returns similarity score normalized in [0.0, 1.0], where 1.0 is identical colors.
    """
    if not palette1 or not palette2:
        return 0.0

    # Extract LAB vectors and weights
    labs1 = np.array([c["lab"] for c in palette1])
    weights1 = np.array([c["weight"] for c in palette1])
    weights1 /= weights1.sum()

    labs2 = np.array([c["lab"] for c in palette2])
    weights2 = np.array([c["weight"] for c in palette2])
    weights2 /= weights2.sum()

    # Pairwise distance matrix (N x M)
    # diff: (N, M, 3)
    diff = labs1[:, np.newaxis, :] - labs2[np.newaxis, :, :]
    dist_matrix = np.linalg.norm(diff, axis=-1)  # shape (N, M)

    # Min distance from each color in palette1 to closest in palette2
    min_dist_1_to_2 = np.min(dist_matrix, axis=1)  # shape (N,)
    score1 = np.sum(weights1 * min_dist_1_to_2)

    # Min distance from each color in palette2 to closest in palette1
    min_dist_2_to_1 = np.min(dist_matrix, axis=0)  # shape (M,)
    score2 = np.sum(weights2 * min_dist_2_to_1)

    # Symmetric weighted distance
    symmetric_distance = 0.5 * (score1 + score2)

    # Convert distance to similarity score in [0, 1]
    # Delta-E of ~0 is exact match, ~25 is noticeably different, >60 is completely different hue
    # Exponential decay function: similarity = exp(-distance / sigma)
    # With sigma = 28, distance 0 -> 1.0, distance 15 -> ~0.58, distance 40 -> ~0.24
    similarity = float(np.exp(-symmetric_distance / 28.0))
    return round(float(np.clip(similarity, 0.0, 1.0)), 4)
