#!/usr/bin/env python3
"""
FashionCLIP ONNX Export Script with FP16 Quantization
Exports vision and text encoders separately with automatic dependency management.

Requirements based on: ExtractingQuantizediPhoneOptimizedModelsAndRuntime.md
- Python: 3.10-3.11
- PyTorch: 2.0.0-2.3.x
- ONNX: 1.14.0-1.16.0
- ONNX Opset: 17-18
- onnxruntime: 1.17.1-1.17.3
- transformers: 4.23.1-4.35.0
"""

import sys
import subprocess
import os
from pathlib import Path

def check_and_install_packages():
    """Verify and install required packages with recommended versions."""
    required_packages = {
        'torch': '2.0.1',
        'onnx': '1.15.0',
        'onnxruntime': '1.17.3',
        'onnxconverter-common': '1.14.0',
        'transformers': '4.35.0',
        'protobuf': '3.20.3',
        'numpy': '1.24.3',
    }

    print("=" * 70)
    print("FashionCLIP ONNX Export - Dependency Check")
    print("=" * 70)

    # Check Python version
    py_version = sys.version_info
    if not (py_version.major == 3 and 10 <= py_version.minor <= 11):
        print(f"WARNING: Python {py_version.major}.{py_version.minor} detected.")
        print("Recommended: Python 3.10-3.11 for maximum stability.")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    else:
        print(f"✓ Python {py_version.major}.{py_version.minor} (recommended)")

    print("\nChecking required packages...")
    missing_packages = []

    for package, version in required_packages.items():
        try:
            if package == 'onnxconverter-common':
                import_name = 'onnxconverter_common'
            else:
                import_name = package.replace('-', '_')

            module = __import__(import_name)
            installed_version = getattr(module, '__version__', 'unknown')
            print(f"✓ {package:25} {installed_version}")
        except ImportError:
            print(f"✗ {package:25} NOT INSTALLED")
            missing_packages.append(f"{package}=={version}")

    if missing_packages:
        print("\n" + "=" * 70)
        print("Missing packages detected. Install with:")
        print(f"  pip install {' '.join(missing_packages)}")
        print("=" * 70)
        response = input("\nInstall automatically? (y/n): ")

        if response.lower() == 'y':
            print("\nInstalling packages...")
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install'
            ] + missing_packages)
            print("✓ Installation complete")
        else:
            print("Please install required packages before running this script.")
            sys.exit(1)

    print("\n✓ All dependencies satisfied\n")

def export_fashion_clip():
    """Export FashionCLIP vision and text encoders to ONNX with FP16 quantization."""
    import torch
    import onnx
    from transformers import CLIPModel, CLIPProcessor
    from onnxconverter_common import float16

    # Configuration
    output_dir = Path("./exported_models")
    output_dir.mkdir(exist_ok=True)

    print("=" * 70)
    print("Loading FashionCLIP Model")
    print("=" * 70)

    # Load FashionCLIP
    print("Downloading patrickjohncyh/fashion-clip from HuggingFace...")
    model = CLIPModel.from_pretrained("patrickjohncyh/fashion-clip")
    processor = CLIPProcessor.from_pretrained("patrickjohncyh/fashion-clip")
    model.eval()
    print("✓ Model loaded successfully\n")

    # Export Vision Encoder
    print("=" * 70)
    print("Exporting Vision Encoder")
    print("=" * 70)

    class VisionEncoder(torch.nn.Module):
        def __init__(self, clip_model):
            super().__init__()
            self.vision_model = clip_model.vision_model
            self.visual_projection = clip_model.visual_projection

        def forward(self, pixel_values):
            vision_outputs = self.vision_model(pixel_values=pixel_values)
            image_embeds = vision_outputs.pooler_output
            image_embeds = self.visual_projection(image_embeds)
            # L2 normalize (critical for similarity calculations)
            image_embeds = image_embeds / image_embeds.norm(p=2, dim=-1, keepdim=True)
            return image_embeds

    vision_encoder = VisionEncoder(model)
    dummy_image = torch.randn(1, 3, 224, 224)

    vision_path = output_dir / "fashionclip_image_encoder_fp16.onnx"
    print(f"Exporting to: {vision_path}")
    print("  Input: pixel_values [batch, 3, 224, 224] float32")
    print("  Output: image_embeds [batch, 512] float32 (L2-normalized)")

    torch.onnx.export(
        vision_encoder,
        dummy_image,
        str(vision_path),
        input_names=['pixel_values'],
        output_names=['image_embeds'],
        dynamic_axes={'pixel_values': {0: 'batch_size'}},
        opset_version=17,
        do_constant_folding=True
    )
    print(f"✓ Vision encoder exported ({vision_path.stat().st_size / 1024 / 1024:.2f} MB)\n")

    # Export Text Encoder
    print("=" * 70)
    print("Exporting Text Encoder")
    print("=" * 70)

    class TextEncoder(torch.nn.Module):
        def __init__(self, clip_model):
            super().__init__()
            self.text_model = clip_model.text_model
            self.text_projection = clip_model.text_projection

        def forward(self, input_ids, attention_mask):
            text_outputs = self.text_model(
                input_ids=input_ids,
                attention_mask=attention_mask
            )
            text_embeds = text_outputs.pooler_output
            text_embeds = self.text_projection(text_embeds)
            # L2 normalize (critical for similarity calculations)
            text_embeds = text_embeds / text_embeds.norm(p=2, dim=-1, keepdim=True)
            return text_embeds

    text_encoder = TextEncoder(model)
    dummy_input_ids = torch.randint(0, 49408, (1, 77))
    dummy_attention_mask = torch.ones(1, 77)

    text_path = output_dir / "fashion_clip_text.onnx"
    print(f"Exporting to: {text_path}")
    print("  Inputs: input_ids [batch, 77] int64, attention_mask [batch, 77] int64")
    print("  Output: text_embeds [batch, 512] float32 (L2-normalized)")

    torch.onnx.export(
        text_encoder,
        (dummy_input_ids, dummy_attention_mask),
        str(text_path),
        input_names=['input_ids', 'attention_mask'],
        output_names=['text_embeds'],
        dynamic_axes={
            'input_ids': {0: 'batch_size'},
            'attention_mask': {0: 'batch_size'}
        },
        opset_version=17,
        do_constant_folding=True
    )
    print(f"✓ Text encoder exported ({text_path.stat().st_size / 1024 / 1024:.2f} MB)\n")

    # FP16 Quantization
    print("=" * 70)
    print("Converting to FP16 (50% size reduction)")
    print("=" * 70)

    for model_name, model_path in [
        ("Vision Encoder", vision_path),
        ("Text Encoder", text_path)
    ]:
        print(f"\nProcessing {model_name}...")

        # Load FP32 model
        model_fp32 = onnx.load(str(model_path))
        fp32_size = model_path.stat().st_size / 1024 / 1024

        # Convert to FP16
        print("  Converting float32 -> float16 (keep I/O as float32)...")
        model_fp16 = float16.convert_float_to_float16(
            model_fp32,
            keep_io_types=True,  # Keep inputs/outputs as FP32 for compatibility
            min_positive_val=1e-7,
            max_finite_val=1e4
        )

        # Save FP16 model
        fp16_path = model_path.parent / model_path.name.replace('.onnx', '_fp16.onnx')
        onnx.save(model_fp16, str(fp16_path))
        fp16_size = fp16_path.stat().st_size / 1024 / 1024

        reduction = ((fp32_size - fp16_size) / fp32_size) * 100
        print(f"  FP32: {fp32_size:.2f} MB")
        print(f"  FP16: {fp16_size:.2f} MB ({reduction:.1f}% reduction)")
        print(f"  ✓ Saved to: {fp16_path}")

    # Final summary
    print("\n" + "=" * 70)
    print("Export Complete - Summary")
    print("=" * 70)
    print("\nExported models:")
    for file in sorted(output_dir.glob("fashion_clip_*.onnx")):
        size_mb = file.stat().st_size / 1024 / 1024
        print(f"  {file.name:35} {size_mb:8.2f} MB")

    print("\nModel specifications:")
    print("  Vision Encoder:")
    print("    Input:  pixel_values [batch, 3, 224, 224] float32")
    print("    Preprocessing: Resize to 224x224, normalize with")
    print("                   mean=[0.48145466, 0.4578275, 0.40821073]")
    print("                   std=[0.26862954, 0.26130258, 0.27577711]")
    print("    Output: image_embeds [batch, 512] L2-normalized")
    print("\n  Text Encoder:")
    print("    Inputs: input_ids [batch, 77] int64")
    print("            attention_mask [batch, 77] int64")
    print("    Tokenization: BPE tokenizer, vocab size 49,408, max 77 tokens")
    print("    Output: text_embeds [batch, 512] L2-normalized")
    print("\nBrowser deployment:")
    print("  - Use FP16 models for production (50% smaller)")
    print("  - Requires Chrome/Edge 121+ for fp16 WebGPU support")
    print("  - onnxruntime-web 1.17.0+ with JSEP")
    print("  - Combined size: ~300 MB (consider caching strategies)")
    print("=" * 70)

if __name__ == "__main__":
    try:
        # Step 1: Check and install dependencies
        check_and_install_packages()

        # Step 2: Export and quantize models
        export_fashion_clip()

        print("\n✓ Script completed successfully!")

    except KeyboardInterrupt:
        print("\n\nScript interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)