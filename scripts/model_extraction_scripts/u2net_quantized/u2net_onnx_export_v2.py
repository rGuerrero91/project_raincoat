#!/usr/bin/env python3
"""
U2Net ONNX Export Script with FP16 Quantization
Exports U2Net/U2NetP for background removal with automatic dependency management.

Requirements based on: ExtractingQuantizediPhoneOptimizedModelsAndRuntime.md
- Python: 3.10-3.11
- PyTorch: 2.0.0-2.3.x
- ONNX: 1.14.0-1.16.0
- ONNX Opset: 11-12 (for U2Net)
- onnxruntime: 1.17.1-1.17.3

Model Options:
- U2Net (standard): 176MB -> 88MB with FP16
- U2NetP (optimized): 4.7MB -> 2.35MB with FP16 (recommended for browser)
"""

import sys
import subprocess
from pathlib import Path

def check_and_install_packages():
    """Verify and install required packages with recommended versions."""
    required_packages = {
        'torch': '2.0.1',
        'onnx': '1.15.0',
        'onnxruntime': '1.17.3',
        'onnxconverter-common': '1.14.0',
        'protobuf': '3.20.3',
        'numpy': '1.24.3',
    }

    print("=" * 70)
    print("U2Net ONNX Export - Dependency Check")
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

def check_u2net_files():
    """Check for U2Net model files and architecture."""
    print("=" * 70)
    print("U2Net Model Files Check")
    print("=" * 70)

    # Check for model architecture file
    model_file = Path("model.py")
    if not model_file.exists():
        print("\n✗ ERROR: model.py not found!")
        print("\nU2Net model architecture is required. Please:")
        print("  1. Clone the official U2Net repository:")
        print("     git clone https://github.com/xuebinqin/U-2-Net.git")
        print("  2. Copy model/u2net.py to this directory as model.py")
        print("  3. Or ensure model.py contains U2NET and U2NETP classes")
        return False
    else:
        print(f"✓ Found model architecture: {model_file}")

    # Check for pretrained weights
    weight_files = {
        'u2net.pth': 'U2Net standard (176MB)',
        'u2netp.pth': 'U2NetP optimized (4.7MB) - RECOMMENDED',
    }

    found_weights = []
    for weight_file, description in weight_files.items():
        if Path(weight_file).exists():
            size_mb = Path(weight_file).stat().st_size / 1024 / 1024
            print(f"✓ Found {weight_file}: {description} ({size_mb:.1f} MB)")
            found_weights.append(weight_file)
        else:
            print(f"✗ Missing {weight_file}: {description}")

    if not found_weights:
        print("\n✗ ERROR: No pretrained weights found!")
        print("\nDownload pretrained weights from:")
        print("  U2Net:  https://github.com/xuebinqin/U-2-Net (176MB)")
        print("  U2NetP: https://github.com/xuebinqin/U-2-Net (4.7MB)")
        print("\nFor browser deployment, U2NetP is strongly recommended.")
        return False

    print(f"\n✓ Model files ready")
    return True

def export_u2net(model_path='u2netp.pth', use_u2netp=True):
    """Export U2Net to ONNX with FP16 quantization."""
    import torch
    import onnx
    from onnxconverter_common import float16

    # Import U2Net model architecture
    try:
        from model import U2NET, U2NETP
    except ImportError:
        print("\n✗ ERROR: Cannot import U2NET from model.py")
        print("Please ensure model.py contains the U2Net architecture.")
        sys.exit(1)

    # Configuration
    output_dir = Path("./exported_models")
    output_dir.mkdir(exist_ok=True)

    model_name = "U2NetP" if use_u2netp else "U2Net"
    print("=" * 70)
    print(f"Loading {model_name} Model")
    print("=" * 70)

    # Load model
    print(f"Loading weights from: {model_path}")
    if use_u2netp:
        model = U2NETP(in_ch=3, out_ch=1)
    else:
        model = U2NET(in_ch=3, out_ch=1)

    model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()
    print("✓ Model loaded successfully\n")

    # Export to ONNX
    print("=" * 70)
    print(f"Exporting {model_name} to ONNX")
    print("=" * 70)

    # Standard input size is 320x320
    dummy_input = torch.randn(1, 3, 320, 320)

    output_name = f"u2net{'p' if use_u2netp else ''}.onnx"
    onnx_path = output_dir / output_name

    print(f"Exporting to: {onnx_path}")
    print("  Input: input [batch, 3, 320, 320] float32")
    print("  Preprocessing: Resize to 320x320, normalize [0,1]")
    print("                 then mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]")
    print("  Output: d0 [batch, 1, 320, 320] float32 (probability map)")
    print("\nNote: Exporting only d0 output (final fused result)")
    print("      Other outputs (d1-d6) are intermediate stages, not needed for inference")

    # Export with single output (d0)
    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        export_params=True,
        opset_version=12,  # opset 11 or 12 recommended for U2Net
        do_constant_folding=True,
        input_names=['input'],
        output_names=['d0'],  # Specify only main output
        dynamic_axes={
            'input': {0: 'batch_size', 2: 'height', 3: 'width'},
            'd0': {0: 'batch_size', 2: 'height', 3: 'width'}
        }
    )

    fp32_size = onnx_path.stat().st_size / 1024 / 1024
    print(f"\n✓ {model_name} exported ({fp32_size:.2f} MB)")

    # Validate ONNX model
    print("\nValidating ONNX model...")
    model_onnx = onnx.load(str(onnx_path))
    onnx.checker.check_model(model_onnx)
    print("✓ ONNX model is valid")

    # FP16 Quantization
    print("\n" + "=" * 70)
    print("Converting to FP16 (50% size reduction)")
    print("=" * 70)

    print(f"\nProcessing {model_name}...")
    print("  Converting float32 -> float16 (keep I/O as float32)...")

    model_fp16 = float16.convert_float_to_float16(
        model_onnx,
        keep_io_types=True,  # Keep inputs/outputs as FP32 for compatibility
        min_positive_val=1e-7,
        max_finite_val=1e4,
        disable_shape_infer=False
    )

    # Save FP16 model
    fp16_name = output_name.replace('.onnx', '_fp16.onnx')
    fp16_path = output_dir / fp16_name
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
    for file in sorted(output_dir.glob("u2net*.onnx")):
        size_mb = file.stat().st_size / 1024 / 1024
        print(f"  {file.name:35} {size_mb:8.2f} MB")

    print("\nModel specifications:")
    print("  Input tensor:")
    print("    Name: input")
    print("    Shape: [batch, 3, 320, 320]")
    print("    Type: float32")
    print("    Channel order: RGB")
    print("    Preprocessing:")
    print("      1. Resize to 320x320")
    print("      2. Convert to [0, 1] range (divide by 255)")
    print("      3. Normalize: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]")
    print("\n  Output tensor:")
    print("    Name: d0")
    print("    Shape: [batch, 1, 320, 320]")
    print("    Type: float32")
    print("    Value range: [0, 1] after sigmoid")
    print("    Interpretation: Foreground probability (1=foreground, 0=background)")
    print("\n  Post-processing:")
    print("    1. Normalize: (pred - min) / (max - min)")
    print("    2. Threshold: mask = (normalized > 0.5) * 255")
    print("    3. Apply to original image for background removal")

    print("\nBrowser deployment:")
    print("  - Use FP16 model for production (50% smaller)")
    print("  - Requires Chrome/Edge 113+ for WebGPU support")
    print("  - onnxruntime-web 1.17.0+ with JSEP")
    if use_u2netp:
        print(f"  - U2NetP size: {fp16_size:.2f} MB (excellent for web)")
    else:
        print(f"  - U2Net size: {fp16_size:.2f} MB (consider U2NetP for web)")
    print("  - WebGPU provides 1.5-3x speedup vs CPU")
    print("=" * 70)

if __name__ == "__main__":
    try:
        # Step 1: Check and install dependencies
        check_and_install_packages()

        # Step 2: Check for U2Net model files
        if not check_u2net_files():
            sys.exit(1)

        # Step 3: Choose model variant
        print("\n" + "=" * 70)
        print("Model Selection")
        print("=" * 70)
        print("Available models:")
        print("  1. U2NetP (4.7MB)  - Optimized variant, RECOMMENDED for browser")
        print("  2. U2Net  (176MB)  - Standard variant, better accuracy")

        # Check which weights are available
        has_u2netp = Path('u2netp.pth').exists()
        has_u2net = Path('u2net.pth').exists()

        if has_u2netp and has_u2net:
            choice = input("\nSelect model (1 or 2, default=1): ").strip() or "1"
            use_u2netp = choice == "1"
            model_path = 'u2netp.pth' if use_u2netp else 'u2net.pth'
        elif has_u2netp:
            print("\nUsing U2NetP (only available weights)")
            use_u2netp = True
            model_path = 'u2netp.pth'
        elif has_u2net:
            print("\nUsing U2Net (only available weights)")
            use_u2netp = False
            model_path = 'u2net.pth'
        else:
            print("\n✗ ERROR: No model weights found!")
            sys.exit(1)

        # Step 4: Export and quantize
        export_u2net(model_path=model_path, use_u2netp=use_u2netp)

        print("\n✓ Script completed successfully!")

    except KeyboardInterrupt:
        print("\n\nScript interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)