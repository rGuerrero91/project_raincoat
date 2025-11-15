"""
Quantize U2-Net model from FP32 to FP16 or INT8
Reduces model size by 50-75% for mobile deployment
"""

import torch
import onnx
from onnx import numpy_helper
from pathlib import Path
import sys

def quantize_model_fp16(input_path: str, output_path: str):
    """
    Quantize ONNX model to FP16 precision
    ~50% size reduction, minimal accuracy loss

    Note: FP16 conversion uses onnxconverter-common for proper graph transformations.
    """
    try:
        from onnxconverter_common import float16
    except ImportError:
        print("Installing onnxconverter-common...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'onnxconverter-common'])
        from onnxconverter_common import float16

    print(f"Loading model from: {input_path}")
    model = onnx.load(input_path)

    print("Converting model to FP16...")

    # Use onnxconverter-common for proper FP16 conversion
    # This handles all graph transformations correctly
    model_fp16 = float16.convert_float_to_float16(model, keep_io_types=False)

    print(f"Saving FP16 model to: {output_path}")
    onnx.save(model_fp16, output_path)

    # Verify output
    original_size = Path(input_path).stat().st_size / (1024 * 1024)
    quantized_size = Path(output_path).stat().st_size / (1024 * 1024)
    reduction = ((original_size - quantized_size) / original_size) * 100

    print(f"\n✓ FP16 Conversion complete!")
    print(f"  Original:  {original_size:.1f} MB")
    print(f"  FP16:      {quantized_size:.1f} MB")
    print(f"  Reduction: {reduction:.1f}%")

    return output_path

def quantize_model_int8(input_path: str, output_path: str, calibration_data=None):
    """
    Quantize ONNX model to INT8 precision
    ~75% size reduction, some accuracy loss
    Requires calibration data for best results
    """
    print(f"Loading model from: {input_path}")
    
    from onnxruntime.quantization import quantize_static, QuantType, CalibrationDataReader
    import numpy as np
    
    # Create calibration data reader
    class U2NetCalibrationDataReader(CalibrationDataReader):
        def __init__(self, num_samples=100):
            self.num_samples = num_samples
            self.current_index = 0
            # Generate random calibration data (320x320 images)
            # In production, use real clothing images
            self.data = []
            for _ in range(num_samples):
                # Random image normalized like U2-Net expects
                img = np.random.randn(1, 3, 320, 320).astype(np.float32)
                self.data.append({'input.1': img})
        
        def get_next(self):
            if self.current_index >= self.num_samples:
                return None
            data = self.data[self.current_index]
            self.current_index += 1
            return data
    
    print("Creating calibration data reader...")
    calibration_reader = U2NetCalibrationDataReader(num_samples=100)
    
    print("Quantizing to INT8 (this may take a few minutes)...")
    quantize_static(
        model_input=input_path,
        model_output=output_path,
        calibration_data_reader=calibration_reader,
        quant_format=QuantType.QInt8,
        weight_type=QuantType.QInt8
    )
    
    # Verify output
    original_size = Path(input_path).stat().st_size / (1024 * 1024)
    quantized_size = Path(output_path).stat().st_size / (1024 * 1024)
    reduction = ((original_size - quantized_size) / original_size) * 100
    
    print(f"\n✓ INT8 Quantization complete!")
    print(f"  Original:  {original_size:.1f} MB")
    print(f"  Quantized: {quantized_size:.1f} MB")
    print(f"  Reduction: {reduction:.1f}%")
    
    return output_path

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Quantize U2-Net ONNX model')
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    parser.add_argument('--input', default=PROJECT_ROOT / 'raincoat_api/public/models/u2net_fp32.onnx', help='Input ONNX model path')
    parser.add_argument('--precision', choices=['fp16', 'int8'], default='fp16', 
                       help='Target precision (fp16 recommended)')
    parser.add_argument('--output', help='Output path (auto-generated if not specified)')
    
    args = parser.parse_args()
    
    # Auto-generate output path
    if not args.output:
        input_path = Path(args.input)
        args.output = str(input_path.parent / f"u2net_{args.precision}.onnx")
    
    print("="*60)
    print(f"U2-Net Model Quantization: {args.precision.upper()}")
    print("="*60)
    
    # Install dependencies if needed
    try:
        import onnxruntime
    except ImportError:
        print("\nInstalling onnxruntime...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'onnxruntime'])
    
    # Quantize based on precision
    if args.precision == 'fp16':
        output_path = quantize_model_fp16(args.input, args.output)
    else:  # int8
        output_path = quantize_model_int8(args.input, args.output)
    
    print(f"\n✓ Saved to: {output_path}")
    print("\nNext steps:")
    print(f"1. Test the quantized model: python test_quantized_u2net.py --model {output_path}")
    print(f"2. Compare quality with original model")
    print(f"3. Deploy to CDN: cp {output_path} ../../raincoat_api/public/models/")
    print(f"4. Update frontend to use: /models/{Path(output_path).name}")

if __name__ == "__main__":
    main()