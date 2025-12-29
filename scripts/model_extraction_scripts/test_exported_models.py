#!/usr/bin/env python3
"""
Test Script for Exported ONNX Models
Tests FashionCLIP and U2Net models to verify they produce expected outputs.

This script:
1. Loads the exported FP16 ONNX models
2. Processes a test image through each model
3. Validates output shapes and value ranges
4. Compares FP16 vs FP32 outputs for accuracy
5. Tests model preprocessing and post-processing pipelines
"""

import sys
import numpy as np
from pathlib import Path
import urllib.request
from PIL import Image
import io

def check_dependencies():
    """Check and import required packages."""
    try:
        import onnxruntime as ort
        print(f"✓ onnxruntime {ort.__version__}")
    except ImportError:
        print("✗ onnxruntime not found. Install with: pip install onnxruntime")
        sys.exit(1)

    try:
        from PIL import Image
        print(f"✓ Pillow {Image.__version__}")
    except ImportError:
        print("✗ Pillow not found. Install with: pip install pillow")
        sys.exit(1)

    print()

def download_test_image():
    """Download a test fashion image."""
    print("=" * 70)
    print("Downloading Test Image")
    print("=" * 70)

    # Using a sample fashion image from Unsplash
    test_image_url = "https://images.unsplash.com/photo-1721746033898-570230f0b1d6"

    try:
        print(f"Downloading from: {test_image_url}")
        with urllib.request.urlopen(test_image_url) as response:
            image_data = response.read()

        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        print(f"✓ Downloaded image: {image.size} ({image.mode})")
        print()
        return image

    except Exception as e:
        print(f"✗ Failed to download image: {e}")
        print("\nCreating synthetic test image instead...")
        # Create a simple test pattern
        image = Image.new('RGB', (500, 500), color=(200, 150, 100))
        print(f"✓ Created synthetic image: {image.size}")
        print()
        return image

def preprocess_image_fclip(image):
    """
    Preprocess image for FashionCLIP vision encoder.

    Expected input:
    - Size: 224x224
    - Normalization: mean=[0.48145466, 0.4578275, 0.40821073]
                     std=[0.26862954, 0.26130258, 0.27577711]
    - Format: [1, 3, 224, 224] CHW, float32
    """
    # Resize to 224x224
    image_resized = image.resize((224, 224), Image.BILINEAR)

    # Convert to numpy array and normalize to [0, 1]
    img_array = np.array(image_resized).astype(np.float32) / 255.0

    # Apply ImageNet normalization (CLIP standard)
    mean = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
    std = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)

    img_array = (img_array - mean) / std

    # Convert from HWC to CHW format
    img_array = np.transpose(img_array, (2, 0, 1))

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array

def preprocess_image_u2net(image):
    """
    Preprocess image for U2Net.

    Expected input:
    - Size: 320x320
    - Normalization: [0,1] then mean=[0.485, 0.456, 0.406]
                                  std=[0.229, 0.224, 0.225]
    - Format: [1, 3, 320, 320] CHW, float32
    """
    # Resize to 320x320
    image_resized = image.resize((320, 320), Image.BILINEAR)

    # Convert to numpy array and normalize to [0, 1]
    img_array = np.array(image_resized).astype(np.float32) / 255.0

    # Apply ImageNet normalization
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

    img_array = (img_array - mean) / std

    # Convert from HWC to CHW format
    img_array = np.transpose(img_array, (2, 0, 1))

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array

def postprocess_u2net_mask(output):
    """
    Post-process U2Net output to create binary mask.

    Output is [1, 1, 320, 320] probability map.
    Returns normalized mask [0-255].
    """
    # Remove batch dimension
    mask = output[0, 0]

    # Normalize to [0, 1]
    ma = np.max(mask)
    mi = np.min(mask)

    if (ma - mi) > 0:
        normalized = (mask - mi) / (ma - mi)
    else:
        normalized = mask

    # Convert to [0, 255]
    mask_uint8 = (normalized * 255).astype(np.uint8)

    return mask_uint8, normalized

def test_fclip_vision_encoder(model_dir):
    """Test FashionCLIP vision encoder."""
    print("=" * 70)
    print("Testing FashionCLIP Vision Encoder")
    print("=" * 70)

    # Find model files
    fp32_path = model_dir / "fashionclip_image_encoder_fp32.onnx"
    fp16_path = model_dir / "fashionclip_image_encoder_fp16.onnx"

    if not fp16_path.exists():
        print(f"✗ Model not found: {fp16_path}")
        return False

    print(f"Loading model: {fp16_path.name}")
    print(f"Size: {fp16_path.stat().st_size / 1024 / 1024:.2f} MB")

    # Load model
    import onnxruntime as ort
    session = ort.InferenceSession(str(fp16_path))

    # Print model info
    input_info = session.get_inputs()[0]
    output_info = session.get_outputs()[0]

    print(f"\nModel I/O:")
    print(f"  Input:  {input_info.name} {input_info.shape} {input_info.type}")
    print(f"  Output: {output_info.name} {output_info.shape} {output_info.type}")

    # Download and preprocess test image
    test_image = download_test_image()
    pixel_values = preprocess_image_fclip(test_image)

    print(f"\nRunning inference...")
    print(f"  Input shape: {pixel_values.shape}")
    print(f"  Input dtype: {pixel_values.dtype}")
    print(f"  Input range: [{pixel_values.min():.3f}, {pixel_values.max():.3f}]")

    # Run inference
    outputs = session.run(None, {input_info.name: pixel_values})
    image_embeds = outputs[0]

    print(f"\nResults:")
    print(f"  Output shape: {image_embeds.shape}")
    print(f"  Output dtype: {image_embeds.dtype}")
    print(f"  Output range: [{image_embeds.min():.3f}, {image_embeds.max():.3f}]")

    # Validate output
    expected_shape = (1, 512)
    if image_embeds.shape != expected_shape:
        print(f"  ✗ FAIL: Expected shape {expected_shape}, got {image_embeds.shape}")
        return False

    # Check L2 normalization (embeddings should have norm ~1.0)
    norm = np.linalg.norm(image_embeds[0])
    print(f"  L2 norm: {norm:.6f}")

    if abs(norm - 1.0) > 0.01:
        print(f"  ⚠ WARNING: Embeddings not L2-normalized (expected ~1.0)")
    else:
        print(f"  ✓ Embeddings are L2-normalized")

    # Compare FP32 vs FP16 if FP32 exists
    if fp32_path.exists():
        print(f"\nComparing FP32 vs FP16:")
        session_fp32 = ort.InferenceSession(str(fp32_path))
        outputs_fp32 = session_fp32.run(None, {input_info.name: pixel_values})
        image_embeds_fp32 = outputs_fp32[0]

        diff = np.abs(image_embeds - image_embeds_fp32).max()
        cosine_sim = np.dot(image_embeds[0], image_embeds_fp32[0]) / (
            np.linalg.norm(image_embeds[0]) * np.linalg.norm(image_embeds_fp32[0])
        )

        print(f"  Max absolute difference: {diff:.6f}")
        print(f"  Cosine similarity: {cosine_sim:.6f}")

        if cosine_sim > 0.999:
            print(f"  ✓ FP16 accuracy is excellent")
        elif cosine_sim > 0.99:
            print(f"  ✓ FP16 accuracy is good")
        else:
            print(f"  ⚠ WARNING: FP16 accuracy may be degraded")

    print(f"\n✓ FashionCLIP Vision Encoder: PASSED\n")
    return True

def tokenize_text(text, max_length=77):
    """
    Simple tokenizer for CLIP text.
    In production, use transformers.CLIPTokenizer.
    This is a placeholder that creates valid token structure.
    """
    # For proper testing, we need the actual CLIPTokenizer
    try:
        from transformers import CLIPTokenizer
        tokenizer = CLIPTokenizer.from_pretrained("patrickjohncyh/fashion-clip")

        inputs = tokenizer(
            text,
            padding="max_length",
            max_length=max_length,
            truncation=True,
            return_tensors="np"
        )

        # IMPORTANT: attention_mask must be float32, not int64
        return inputs['input_ids'].astype(np.int64), inputs['attention_mask'].astype(np.float32)

    except ImportError:
        print("  ⚠ transformers not available, using dummy tokenization")
        # Fallback: create dummy but valid-shaped tensors
        # This won't produce meaningful embeddings but tests the model I/O
        input_ids = np.random.randint(0, 49408, size=(1, max_length), dtype=np.int64)
        attention_mask = np.ones((1, max_length), dtype=np.float32)
        return input_ids, attention_mask

def test_fclip_text_encoder(model_dir, image_embedding=None):
    """Test FashionCLIP text encoder with fashion labels."""
    print("=" * 70)
    print("Testing FashionCLIP Text Encoder")
    print("=" * 70)

    # Find model files
    fp16_path = model_dir / "fashion_clip_text_fp16.onnx"

    if not fp16_path.exists():
        print(f"✗ Model not found: {fp16_path}")
        return False

    print(f"Loading model: {fp16_path.name}")
    print(f"Size: {fp16_path.stat().st_size / 1024 / 1024:.2f} MB")

    # Load model
    import onnxruntime as ort
    session = ort.InferenceSession(str(fp16_path))

    # Print model info
    print(f"\nModel I/O:")
    for inp in session.get_inputs():
        print(f"  Input:  {inp.name} {inp.shape} {inp.type}")
    for out in session.get_outputs():
        print(f"  Output: {out.name} {out.shape} {out.type}")

    # Test with fashion labels
    fashion_labels = [
        "black leather jacket",
        "white cotton t-shirt",
        "blue denim jeans",
        "red dress",
        "winter coat",
        "summer dress",
        "athletic sneakers",
        "formal blazer"
    ]

    print(f"\nTesting with {len(fashion_labels)} fashion labels...")

    label_embeddings = []

    for label in fashion_labels:
        input_ids, attention_mask = tokenize_text(label)

        # Run inference
        outputs = session.run(None, {
            'input_ids': input_ids,
            'attention_mask': attention_mask
        })
        text_embeds = outputs[0]
        label_embeddings.append((label, text_embeds))

    # Validate first embedding
    text_embeds = label_embeddings[0][1]

    print(f"\nResults (first label: '{fashion_labels[0]}'):")
    print(f"  Output shape: {text_embeds.shape}")
    print(f"  Output dtype: {text_embeds.dtype}")
    print(f"  Output range: [{text_embeds.min():.3f}, {text_embeds.max():.3f}]")

    # Validate output
    expected_shape = (1, 512)
    if text_embeds.shape != expected_shape:
        print(f"  ✗ FAIL: Expected shape {expected_shape}, got {text_embeds.shape}")
        return False

    # Check L2 normalization
    norm = np.linalg.norm(text_embeds[0])
    print(f"  L2 norm: {norm:.6f}")

    if abs(norm - 1.0) > 0.01:
        print(f"  ⚠ WARNING: Embeddings not L2-normalized (expected ~1.0)")
    else:
        print(f"  ✓ Embeddings are L2-normalized")

    # If we have an image embedding, compute similarities
    if image_embedding is not None:
        print(f"\nImage-Text Similarity Scores:")
        print(f"{'Label':<30} {'Similarity':>12}")
        print("-" * 45)

        similarities = []
        for label, text_emb in label_embeddings:
            # Cosine similarity (already L2-normalized)
            similarity = np.dot(image_embedding[0], text_emb[0])
            similarities.append((label, similarity))
            print(f"{label:<30} {similarity:>12.4f}")

        # Find best match
        best_label, best_score = max(similarities, key=lambda x: x[1])
        print(f"\n  ✓ Best match: '{best_label}' (score: {best_score:.4f})")

    print(f"\n✓ FashionCLIP Text Encoder: PASSED\n")
    return True

def test_u2net(model_dir):
    """Test U2Net background removal."""
    print("=" * 70)
    print("Testing U2Net Background Removal")
    print("=" * 70)

    # Find model files
    fp16_path = model_dir / "u2net_fp16_tiny.onnx"

    if not fp16_path.exists():
        # Try standard u2net
        fp16_path = model_dir / "u2net_fp16.onnx"

    if not fp16_path.exists():
        print(f"✗ Model not found in: {model_dir}")
        return False

    print(f"Loading model: {fp16_path.name}")
    print(f"Size: {fp16_path.stat().st_size / 1024 / 1024:.2f} MB")

    # Load model
    import onnxruntime as ort
    session = ort.InferenceSession(str(fp16_path))

    # Print model info
    input_info = session.get_inputs()[0]
    output_info = session.get_outputs()[0]

    print(f"\nModel I/O:")
    print(f"  Input:  {input_info.name} {input_info.shape} {input_info.type}")
    print(f"  Output: {output_info.name} {output_info.shape} {output_info.type}")

    # Download and preprocess test image
    test_image = download_test_image()
    input_data = preprocess_image_u2net(test_image)

    print(f"\nRunning inference...")
    print(f"  Input shape: {input_data.shape}")
    print(f"  Input dtype: {input_data.dtype}")
    print(f"  Input range: [{input_data.min():.3f}, {input_data.max():.3f}]")

    # Run inference
    outputs = session.run(None, {input_info.name: input_data})
    mask_output = outputs[0]

    print(f"\nResults:")
    print(f"  Output shape: {mask_output.shape}")
    print(f"  Output dtype: {mask_output.dtype}")
    print(f"  Output range: [{mask_output.min():.3f}, {mask_output.max():.3f}]")

    # Validate output
    expected_shape = (1, 1, 320, 320)
    if mask_output.shape != expected_shape:
        print(f"  ✗ FAIL: Expected shape {expected_shape}, got {mask_output.shape}")
        return False

    # Post-process mask
    mask_uint8, normalized = postprocess_u2net_mask(mask_output)

    print(f"\nPost-processed mask:")
    print(f"  Shape: {mask_uint8.shape}")
    print(f"  Range: [{mask_uint8.min()}, {mask_uint8.max()}]")
    print(f"  Mean: {mask_uint8.mean():.2f}")

    # Calculate foreground ratio
    foreground_ratio = (normalized > 0.5).sum() / normalized.size
    print(f"  Foreground ratio (threshold=0.5): {foreground_ratio:.2%}")

    # Save mask for inspection
    mask_image = Image.fromarray(mask_uint8, mode='L')
    output_path = model_dir / "test_mask_output.png"
    mask_image.save(output_path)
    print(f"\n✓ Saved mask to: {output_path}")

    print(f"\n✓ U2Net Background Removal: PASSED\n")
    return True

def compare_with_production(new_models_dir, production_dir):
    """Compare new exported models with current production models."""
    print("=" * 70)
    print("Production Model Comparison")
    print("=" * 70)

    production_path = Path(production_dir)
    if not production_path.exists():
        print(f"⚠ Production directory not found: {production_path}")
        print("Skipping comparison.\n")
        return

    import onnxruntime as ort

    # Download test image once
    test_image = download_test_image()

    comparisons = []

    # Compare FashionCLIP Vision Encoder
    print("\n--- FashionCLIP Vision Encoder Comparison ---")
    new_fclip = new_models_dir / "fclip_quantized" / "exported_models" / "fashionclip_image_encoder_fp16.onnx"
    prod_fclip = production_path / "fashionclip_image_encoder_fp32.onnx"

    if new_fclip.exists() and prod_fclip.exists():
        print(f"New model:        {new_fclip.name} ({new_fclip.stat().st_size / 1024 / 1024:.2f} MB)")
        print(f"Production model: {prod_fclip.name} ({prod_fclip.stat().st_size / 1024 / 1024:.2f} MB)")

        # Preprocess image
        pixel_values = preprocess_image_fclip(test_image)

        # Run both models
        sess_new = ort.InferenceSession(str(new_fclip))
        sess_prod = ort.InferenceSession(str(prod_fclip))

        out_new = sess_new.run(None, {'pixel_values': pixel_values})[0]

        # Check production model input names
        prod_input_name = sess_prod.get_inputs()[0].name
        out_prod = sess_prod.run(None, {prod_input_name: pixel_values})[0]

        # Compare outputs
        cosine_sim = np.dot(out_new[0], out_prod[0]) / (
            np.linalg.norm(out_new[0]) * np.linalg.norm(out_prod[0])
        )
        max_diff = np.abs(out_new - out_prod).max()
        mean_diff = np.abs(out_new - out_prod).mean()

        print(f"\nComparison Results:")
        print(f"  Cosine similarity:     {cosine_sim:.6f}")
        print(f"  Max absolute diff:     {max_diff:.6f}")
        print(f"  Mean absolute diff:    {mean_diff:.6f}")

        if cosine_sim > 0.999:
            print(f"  ✓ EXCELLENT: Models produce nearly identical outputs")
            comparisons.append(("FCLIP Vision", True))
        elif cosine_sim > 0.99:
            print(f"  ✓ GOOD: Models produce very similar outputs")
            comparisons.append(("FCLIP Vision", True))
        elif cosine_sim > 0.95:
            print(f"  ⚠ WARNING: Some divergence detected")
            comparisons.append(("FCLIP Vision", False))
        else:
            print(f"  ✗ FAIL: Significant divergence between models")
            comparisons.append(("FCLIP Vision", False))
    else:
        print(f"⚠ Models not found for comparison")
        if not new_fclip.exists():
            print(f"  Missing: {new_fclip}")
        if not prod_fclip.exists():
            print(f"  Missing: {prod_fclip}")

    # Compare U2Net
    print("\n--- U2Net Comparison ---")
    new_u2net = new_models_dir / "u2net_quantized" / "exported_models" / "u2net_fp16_tiny.onnx"
    if not new_u2net.exists():
        new_u2net = new_models_dir / "u2net_quantized" / "exported_models" / "u2net_fp16.onnx"
    prod_u2net = production_path / "u2net.onnx"

    if new_u2net.exists() and prod_u2net.exists():
        print(f"New model:        {new_u2net.name} ({new_u2net.stat().st_size / 1024 / 1024:.2f} MB)")
        print(f"Production model: {prod_u2net.name} ({prod_u2net.stat().st_size / 1024 / 1024:.2f} MB)")

        # Preprocess image
        input_data = preprocess_image_u2net(test_image)

        # Run both models
        sess_new = ort.InferenceSession(str(new_u2net))
        sess_prod = ort.InferenceSession(str(prod_u2net))

        # Check input/output names
        new_input_name = sess_new.get_inputs()[0].name
        prod_input_name = sess_prod.get_inputs()[0].name
        prod_output_name = sess_prod.get_outputs()[0].name

        out_new = sess_new.run(None, {new_input_name: input_data})[0]
        out_prod = sess_prod.run([prod_output_name], {prod_input_name: input_data})[0]

        # Compare outputs
        max_diff = np.abs(out_new - out_prod).max()
        mean_diff = np.abs(out_new - out_prod).mean()
        correlation = np.corrcoef(out_new.flatten(), out_prod.flatten())[0, 1]

        print(f"\nComparison Results:")
        print(f"  Correlation:           {correlation:.6f}")
        print(f"  Max absolute diff:     {max_diff:.6f}")
        print(f"  Mean absolute diff:    {mean_diff:.6f}")

        # Calculate IoU of masks at threshold 0.5
        mask_new_norm, _ = postprocess_u2net_mask(out_new)
        mask_prod_norm, _ = postprocess_u2net_mask(out_prod)

        mask_new_bin = mask_new_norm > 127
        mask_prod_bin = mask_prod_norm > 127

        intersection = np.logical_and(mask_new_bin, mask_prod_bin).sum()
        union = np.logical_or(mask_new_bin, mask_prod_bin).sum()
        iou = intersection / union if union > 0 else 0

        print(f"  Mask IoU (threshold 0.5): {iou:.4f}")

        if correlation > 0.99 and iou > 0.95:
            print(f"  ✓ EXCELLENT: Models produce nearly identical masks")
            comparisons.append(("U2Net", True))
        elif correlation > 0.95 and iou > 0.90:
            print(f"  ✓ GOOD: Models produce very similar masks")
            comparisons.append(("U2Net", True))
        elif correlation > 0.90 and iou > 0.80:
            print(f"  ⚠ WARNING: Some divergence detected")
            comparisons.append(("U2Net", False))
        else:
            print(f"  ✗ FAIL: Significant divergence between models")
            comparisons.append(("U2Net", False))
    else:
        print(f"⚠ Models not found for comparison")
        if not new_u2net.exists():
            print(f"  Missing: {new_u2net}")
        if not prod_u2net.exists():
            print(f"  Missing: {prod_u2net}")

    # Summary
    if comparisons:
        print("\n" + "=" * 70)
        print("Production Comparison Summary")
        print("=" * 70)
        for name, passed in comparisons:
            status = "✓ COMPATIBLE" if passed else "⚠ REVIEW NEEDED"
            print(f"{name:30} {status}")
        print("=" * 70)

    print()

def main():
    """Run all model tests."""
    print("=" * 70)
    print("ONNX Model Validation Test Suite")
    print("=" * 70)
    print()

    # Check dependencies
    check_dependencies()

    # Find model directories
    script_dir = Path(__file__).parent
    fclip_dir = script_dir / "fclip_quantized" / "exported_models"
    u2net_dir = script_dir / "u2net_quantized" / "exported_models"

    # Alternative paths if models are in different locations
    if not fclip_dir.exists():
        fclip_dir = script_dir / "exported_models"
    if not u2net_dir.exists():
        u2net_dir = script_dir / "exported_models"

    results = []
    image_embedding = None

    # Test FashionCLIP Vision Encoder
    if fclip_dir.exists():
        try:
            # Test vision encoder and capture image embedding
            vision_result = test_fclip_vision_encoder(fclip_dir)
            results.append(("FashionCLIP Vision", vision_result))

            # Get image embedding for text similarity test
            if vision_result:
                try:
                    import onnxruntime as ort
                    fp16_path = fclip_dir / "fashionclip_image_encoder_fp16.onnx"
                    session = ort.InferenceSession(str(fp16_path))
                    test_image = download_test_image()
                    pixel_values = preprocess_image_fclip(test_image)
                    outputs = session.run(None, {'pixel_values': pixel_values})
                    image_embedding = outputs[0]
                except:
                    pass

        except Exception as e:
            print(f"✗ FashionCLIP Vision test failed: {e}")
            import traceback
            traceback.print_exc()
            results.append(("FashionCLIP Vision", False))

        # Test FashionCLIP Text Encoder (with image embedding for similarity)
        try:
            results.append(("FashionCLIP Text", test_fclip_text_encoder(fclip_dir, image_embedding)))
        except Exception as e:
            print(f"✗ FashionCLIP Text test failed: {e}")
            import traceback
            traceback.print_exc()
            results.append(("FashionCLIP Text", False))
    else:
        print(f"⚠ Skipping FashionCLIP tests: directory not found: {fclip_dir}\n")

    # Test U2Net
    if u2net_dir.exists():
        try:
            results.append(("U2Net", test_u2net(u2net_dir)))
        except Exception as e:
            print(f"✗ U2Net test failed: {e}")
            import traceback
            traceback.print_exc()
            results.append(("U2Net", False))
    else:
        print(f"⚠ Skipping U2Net tests: directory not found: {u2net_dir}\n")

    # Print summary
    print("=" * 70)
    print("Test Summary")
    print("=" * 70)

    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{name:30} {status}")

    all_passed = all(result[1] for result in results)

    print("=" * 70)
    if all_passed:
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed")

    # Compare with production models
    production_dir = script_dir.parent.parent / "raincoat_api" / "public" / "models"
    if production_dir.exists():
        compare_with_production(script_dir, production_dir)
    else:
        print(f"\n⚠ Production models not found at: {production_dir}")
        print("Skipping production comparison.\n")

    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
