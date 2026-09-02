"""
clip_utils.py - Pretrained CLIP ViT-B/32 Image Encoder
Extracts 512-dimensional L2-normalized image embeddings using open_clip.
"""

import torch
import open_clip
from PIL import Image
import numpy as np
from typing import List, Union

# Global cached model and preprocess pipeline
_MODEL = None
_PREPROCESS = None
_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def get_clip_model():
    """Lazy load open_clip ViT-B-32 with pretrained OpenAI weights."""
    global _MODEL, _PREPROCESS, _DEVICE
    if _MODEL is None:
        print(f"Loading CLIP ViT-B-32 model on device: {_DEVICE}...")
        model, _, preprocess = open_clip.create_model_and_transforms(
            model_name="ViT-B-32",
            pretrained="openai"
        )
        model = model.to(_DEVICE)
        model.eval()
        _MODEL = model
        _PREPROCESS = preprocess
        print("CLIP ViT-B-32 model loaded successfully.")
    return _MODEL, _PREPROCESS, _DEVICE


def encode_image(image_input: Union[str, Image.Image]) -> List[float]:
    """
    Computes a 512-dimensional L2-normalized CLIP embedding vector.
    image_input: filepath or PIL Image
    returns: list of 512 floats
    """
    model, preprocess, device = get_clip_model()

    if isinstance(image_input, str):
        img = Image.open(image_input).convert("RGB")
    else:
        img = image_input.convert("RGB")

    tensor = preprocess(img).unsqueeze(0).to(device)

    with torch.no_grad():
        image_features = model.encode_image(tensor)
        # L2-normalize vectors so cosine similarity = dot product
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)

    embedding = image_features.cpu().numpy()[0]
    return [round(float(x), 6) for x in embedding]


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two normalized vectors."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    # Cosine similarity for unit vectors is dot product
    sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9)
    return round(float(np.clip(sim, 0.0, 1.0)), 4)
