"""
Test quantized models and compare with original FP32 versions
Measures accuracy degradation and performance improvements
"""

import onnxruntime as ort
import numpy as np
from pathlib import Path
import time
from PIL import Image

def test_u2net_quality(original_path: str, quantized_path: str, test_image_path: str):
    """
    Compare U2-Net background removal quality between FP32 and quantized
    """
    print("\n" + "="*60)
    print("Testing U2-Net Quality")
    print("="*60)

    # Load test image
    img = Image.open(test_image_path).convert('RGB')
    img = img.resize((320, 320))
    img_array = np.array(img).astype(np.float32)

    # Normalize (ensure float32 throughout)
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_normalized = ((img_array / 255.0 - mean) / std).astype(np.float32)
    img_tensor = np.transpose(img_normalized, (2, 0, 1))[np.newaxis, ...].astype(np.float32)

    # Test original model
    print("\n1. Testing original FP32 model...")
    session_fp32 = ort.InferenceSession(original_path)
    start = time.time()
    result_fp32 = session_fp32.run(None, {'input.1': img_tensor})
    time_fp32 = (time.time() - start) * 1000
    mask_fp32 = result_fp32[0]

    print(f"   Inference time: {time_fp32:.0f}ms")
    print(f"   Mask shape: {mask_fp32.shape}")
    print(f"   Mask range: [{mask_fp32.min():.3f}, {mask_fp32.max():.3f}]")

    # Test quantized model
    print("\n2. Testing quantized model...")
    session_quant = ort.InferenceSession(quantized_path)
    start = time.time()
    result_quant = session_quant.run(None, {'input.1': img_tensor.astype(np.float16)})
    time_quant = (time.time() - start) * 1000
    mask_quant = result_quant[0]

    print(f"   Inference time: {time_quant:.0f}ms")
    print(f"   Mask shape: {mask_quant.shape}")
    print(f"   Mask range: [{mask_quant.min():.3f}, {mask_quant.max():.3f}]")

    # Compare results
    print("\n3. Comparing results...")
    mae = np.mean(np.abs(mask_fp32 - mask_quant))
    mse = np.mean((mask_fp32 - mask_quant) ** 2)

    # Calculate percentage of pixels with significant difference
    significant_diff = np.mean(np.abs(mask_fp32 - mask_quant) > 0.1) * 100

    speedup = ((time_fp32 - time_quant) / time_fp32) * 100

    print(f"   Mean Absolute Error: {mae:.6f}")
    print(f"   Mean Squared Error: {mse:.6f}")
    print(f"   Pixels with >0.1 diff: {significant_diff:.2f}%")
    print(f"   Speed improvement: {speedup:.1f}% faster")

    # Quality assessment
    if mae < 0.01:
        quality = "EXCELLENT"
    elif mae < 0.05:
        quality = "GOOD"
    elif mae < 0.1:
        quality = "ACCEPTABLE"
    else:
        quality = "POOR"

    print(f"\n   Overall Quality: {quality}")

    return {
        'mae': mae,
        'mse': mse,
        'time_fp32': time_fp32,
        'time_quant': time_quant,
        'quality': quality
    }

def test_fashionclip_embeddings(original_path: str, quantized_path: str, test_image_path: str):
    """
    Compare FashionCLIP embedding quality between FP32 and quantized
    """
    print("\n" + "="*60)
    print("Testing FashionCLIP Embeddings")
    print("="*60)

    # Load test image
    img = Image.open(test_image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img).astype(np.float32) / 255.0

    # Normalize with FashionCLIP mean/std (ensure float32 throughout)
    mean = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
    std = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)
    img_normalized = ((img_array - mean) / std).astype(np.float32)
    img_tensor = np.transpose(img_normalized, (2, 0, 1))[np.newaxis, ...].astype(np.float32)

    # Test original model
    print("\n1. Testing original FP32 model...")
    session_fp32 = ort.InferenceSession(original_path)
    start = time.time()
    result_fp32 = session_fp32.run(None, {'pixel_values': img_tensor})
    time_fp32 = (time.time() - start) * 1000
    embedding_fp32 = result_fp32[0][0]

    print(f"   Inference time: {time_fp32:.0f}ms")
    print(f"   Embedding shape: {embedding_fp32.shape}")
    print(f"   Embedding norm: {np.linalg.norm(embedding_fp32):.3f}")

    # Test quantized model
    print("\n2. Testing quantized model...")
    session_quant = ort.InferenceSession(quantized_path)
    start = time.time()
    result_quant = session_quant.run(None, {'pixel_values': img_tensor.astype(np.float16)})
    time_quant = (time.time() - start) * 1000
    embedding_quant = result_quant[0][0]

    print(f"   Inference time: {time_quant:.0f}ms")
    print(f"   Embedding shape: {embedding_quant.shape}")
    print(f"   Embedding norm: {np.linalg.norm(embedding_quant):.3f}")

    # Compare embeddings
    print("\n3. Comparing embeddings...")

    # Cosine similarity
    similarity = np.dot(embedding_fp32, embedding_quant) / (
        np.linalg.norm(embedding_fp32) * np.linalg.norm(embedding_quant)
    )

    # L2 distance
    l2_dist = np.linalg.norm(embedding_fp32 - embedding_quant)

    speedup = ((time_fp32 - time_quant) / time_fp32) * 100

    print(f"   Cosine similarity: {similarity:.6f}")
    print(f"   L2 distance: {l2_dist:.6f}")
    print(f"   Speed improvement: {speedup:.1f}% faster")

    # Quality assessment
    if similarity > 0.99:
        quality = "EXCELLENT"
    elif similarity > 0.95:
        quality = "GOOD"
    elif similarity > 0.90:
        quality = "ACCEPTABLE"
    else:
        quality = "POOR"

    print(f"\n   Overall Quality: {quality}")

    return {
        'similarity': similarity,
        'l2_distance': l2_dist,
        'time_fp32': time_fp32,
        'time_quant': time_quant,
        'quality': quality
    }

def main():
    import argparse

    PROJECT_ROOT = Path(__file__).parent.parent.parent

    parser = argparse.ArgumentParser(description='Test quantized model quality')
    parser.add_argument('--test-image', required=True, help='Test image path')
    parser.add_argument('--u2net-original', default=PROJECT_ROOT / 'raincoat_api/public/models/u2net_fp32.onnx')
    parser.add_argument('--u2net-quantized', default=PROJECT_ROOT / 'raincoat_api/public/models/u2net_fp16.onnx')
    parser.add_argument('--fashionclip-original', default=PROJECT_ROOT / 'raincoat_api/public/models/fashionclip_image_encoder_fp32.onnx')
    parser.add_argument('--fashionclip-quantized', default=PROJECT_ROOT / 'raincoat_api/public/models/fashionclip_image_encoder_fp16.onnx')

    args = parser.parse_args()

    print("="*60)
    print("Quantized Model Quality Test")
    print("="*60)

    # Test U2-Net
    u2net_results = test_u2net_quality(
        args.u2net_original,
        args.u2net_quantized,
        args.test_image
    )

    # Test FashionCLIP
    fashionclip_results = test_fashionclip_embeddings(
        args.fashionclip_original,
        args.fashionclip_quantized,
        args.test_image
    )

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\nU2-Net Quality: {u2net_results['quality']}")
    print(f"  MAE: {u2net_results['mae']:.6f}")
    print(f"  Speed: {u2net_results['time_quant']:.0f}ms (was {u2net_results['time_fp32']:.0f}ms)")

    print(f"\nFashionCLIP Quality: {fashionclip_results['quality']}")
    print(f"  Similarity: {fashionclip_results['similarity']:.6f}")
    print(f"  Speed: {fashionclip_results['time_quant']:.0f}ms (was {fashionclip_results['time_fp32']:.0f}ms)")

    # Overall recommendation
    if (u2net_results['quality'] in ['EXCELLENT', 'GOOD'] and
        fashionclip_results['quality'] in ['EXCELLENT', 'GOOD']):
        print("\n✓ RECOMMENDATION: Deploy quantized models to production")
    else:
        print("\n⚠ RECOMMENDATION: Review quality carefully before deploying")

if __name__ == "__main__":
    main()