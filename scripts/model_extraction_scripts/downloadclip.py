# Deprecated: Use export_fashionclip_onnx.py instead

from huggingface_hub import hf_hub_download

model_path = hf_hub_download(
    repo_id="Xenova/clip-vit-base-patch32",
    filename="onnx/vision_model_quantized.onnx",
    cache_dir="./cache"
)

import shutil
shutil.copy(model_path, "./public/models/clip-vit-base-patch32/vision_model_quantized.onnx")
print("Model downloaded successfully!")