"""
Quantize FashionCLIP model from FP32 to FP16 or INT8
"""

import torch
import onnx
from pathlib import Path
import sys
import numpy as np

def quantize_fashionclip_fp16(input_path: str, output_path: str):
    """
    Quantize FashionCLIP to FP16
    ~50% size reduction, minimal accuracy loss

    Note: FP16 conversion is done by converting tensor weights directly,
    not through onnxruntime quantization (which doesn't support FP16).
    """
    from onnx import numpy_helper, TensorProto

    print(f"Loading FashionCLIP model from: {input_path}")
    model = onnx.load(input_path)

    print("Converting weights to FP16...")

    # Convert all FP32 initializers to FP16
    for tensor in model.graph.initializer:
        if tensor.data_type == TensorProto.FLOAT:
            # Convert float32 to float16
            fp32_data = numpy_helper.to_array(tensor)
            fp16_data = fp32_data.astype(np.float16)

            # Update tensor to FP16
            tensor.ClearField('float_data')
            tensor.ClearField('raw_data')
            tensor.data_type = TensorProto.FLOAT16
            tensor.raw_data = fp16_data.tobytes()

    # Update graph value_info and inputs/outputs to FP16 where applicable
    def convert_value_info_to_fp16(value_info):
        if value_info.type.HasField('tensor_type'):
            if value_info.type.tensor_type.elem_type == TensorProto.FLOAT:
                value_info.type.tensor_type.elem_type = TensorProto.FLOAT16

    for value_info in model.graph.value_info:
        convert_value_info_to_fp16(value_info)

    for input_info in model.graph.input:
        convert_value_info_to_fp16(input_info)

    for output_info in model.graph.output:
        convert_value_info_to_fp16(output_info)

    print(f"Saving FP16 model to: {output_path}")
    onnx.save(model, output_path)

    # Verify output
    original_size = Path(input_path).stat().st_size / (1024 * 1024)
    quantized_size = Path(output_path).stat().st_size / (1024 * 1024)
    reduction = ((original_size - quantized_size) / original_size) * 100

    print(f"\n✓ FashionCLIP FP16 Conversion complete!")
    print(f"  Original:  {original_size:.1f} MB")
    print(f"  FP16:      {quantized_size:.1f} MB")
    print(f"  Reduction: {reduction:.1f}%")

    return output_path

def quantize_fashionclip_int8(input_path: str, output_path: str):
    """
    Quantize FashionCLIP to INT8
    ~75% size reduction, some accuracy loss
    """
    from onnxruntime.quantization import quantize_static, CalibrationDataReader
    
    class FashionCLIPCalibrationDataReader(CalibrationDataReader):
        def __init__(self, num_samples=100):
            self.num_samples = num_samples
            self.current_index = 0
            
            # Generate calibration data (224x224 images)
            # Normalized with FashionCLIP's expected mean/std
            mean = np.array([0.48145466, 0.4578275, 0.40821073])
            std = np.array([0.26862954, 0.26130258, 0.27577711])
            
            self.data = []
            for _ in range(num_samples):
                # Random normalized image
                img = np.random.randn(1, 3, 224, 224).astype(np.float32)
                # Apply normalization
                for c in range(3):
                    img[0, c] = (img[0, c] - mean[c]) / std[c]
                self.data.append({'pixel_values': img})
        
        def get_next(self):
            if self.current_index >= self.num_samples:
                return None
            data = self.data[self.current_index]
            self.current_index += 1
            return data
    
    print("Creating calibration data reader...")
    calibration_reader = FashionCLIPCalibrationDataReader(num_samples=100)
    
    print("Quantizing to INT8 (this may take several minutes)...")
    quantize_static(
        model_input=input_path,
        model_output=output_path,
        calibration_data_reader=calibration_reader
    )
    
    original_size = Path(input_path).stat().st_size / (1024 * 1024)
    quantized_size = Path(output_path).stat().st_size / (1024 * 1024)
    reduction = ((original_size - quantized_size) / original_size) * 100
    
    print(f"\n✓ FashionCLIP INT8 Quantization complete!")
    print(f"  Original:  {original_size:.1f} MB")
    print(f"  Quantized: {quantized_size:.1f} MB")
    print(f"  Reduction: {reduction:.1f}%")
    
    return output_path

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Quantize FashionCLIP ONNX model')
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    parser.add_argument('--input', default=PROJECT_ROOT / 'raincoat_api/public/models/fashionclip_image_encoder_fp32.onnx',
                       help='Input ONNX model path')
    parser.add_argument('--precision', choices=['fp16', 'int8'], default='fp16',
                       help='Target precision (fp16 recommended)')
    parser.add_argument('--output', help='Output path (auto-generated if not specified)')
    
    args = parser.parse_args()
    
    # Auto-generate output path
    if not args.output:
        input_path = Path(args.input)
        args.output = str(input_path.parent / f"fashionclip_{args.precision}.onnx")
    
    print("="*60)
    print(f"FashionCLIP Model Quantization: {args.precision.upper()}")
    print("="*60)
    
    # Install dependencies if needed
    try:
        import onnxruntime
    except ImportError:
        print("\nInstalling onnxruntime...")
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'onnxruntime'])
    
    # Quantize
    if args.precision == 'fp16':
        output_path = quantize_fashionclip_fp16(args.input, args.output)
    else:  # int8
        output_path = quantize_fashionclip_int8(args.input, args.output)
    
    print(f"\n✓ Saved to: {output_path}")
    print("\nNext steps:")
    print(f"1. Test embeddings: python test_quantized_fashionclip.py --model {output_path}")
    print(f"2. Compare embedding quality with original")
    print(f"3. Deploy: cp {output_path} ../../raincoat_api/public/models/")

if __name__ == "__main__":
    main()