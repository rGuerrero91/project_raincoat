"""
Trains existing YOLOv8n model on merged Fashionpedia + ModaNet dataset 
Download Full Fashionpedia and Merge with ModaNet
Smart resume functionality with checkpoints
"""

import os
import sys
from pathlib import Path
import json
import shutil
import subprocess

try:
    import yaml
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyyaml"])
    import yaml


def install_dependencies():
    """Install required packages"""
    print("Checking dependencies...")
    
    packages = ['ultralytics', 'datasets', 'Pillow', 'tqdm', 'psutil']
    
    for package in packages:
        try:
            if package == 'datasets':
                from datasets import load_dataset
            elif package == 'ultralytics':
                import ultralytics
            elif package == 'Pillow':
                from PIL import Image
            elif package == 'tqdm':
                from tqdm import tqdm
            elif package == 'psutil':
                import psutil
            print(f"[OK] {package}")
        except (ImportError, AttributeError):
            print(f"Installing {package}...")
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", package
            ])
    
    print("\n[OK] All dependencies installed")

def create_fashionpedia_mapping():
    """Map Fashionpedia's 46 categories to Raincoat's 5"""
    
    mapping = {
        # TOPS (0)
        0: 0, 1: 0, 2: 0, 5: 0, 10: 0,
        # BOTTOMS (1)
        6: 1, 7: 1, 8: 1, 11: 1, 20: 1, 21: 1, 22: 1,
        # OUTERWEAR (2)
        3: 2, 4: 2, 9: 2, 12: 2,
        # SHOES (3)
        23: 3,
        # ACCESSORIES (4)
        13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 24: 4, 25: 4, 26: 4,
        # IGNORE
        27: -1, 28: -1, 29: -1, 30: -1, 31: -1, 32: -1, 33: -1, 34: -1, 35: -1,
        36: -1, 37: -1, 38: -1, 39: -1, 40: -1, 41: -1, 42: -1, 43: -1, 44: -1, 45: -1,
    }
    
    return mapping


def check_dataset_status(fp_dir, merged_dir):
    """
    Check what stage the pipeline is at
    Returns: 'none', 'fashionpedia_partial', 'fashionpedia_complete', 'merged', 'trained'
    """
    fp_dir = Path(fp_dir)
    merged_dir = Path(merged_dir)
    
    # Check if training is complete
    trained_model = Path("runs/raincoat_merged/raincoat_merged/weights/best.pt")
    if trained_model.exists():
        return 'trained', trained_model
    
    # Check if merged dataset exists
    if (merged_dir / 'data.yaml').exists():
        train_images = list((merged_dir / 'train' / 'images').glob('*'))
        valid_images = list((merged_dir / 'valid' / 'images').glob('*'))
        if len(train_images) > 0 and len(valid_images) > 0:
            return 'merged', merged_dir
    
    # Check if Fashionpedia download is complete
    if (fp_dir / 'data.yaml').exists():
        train_images = list((fp_dir / 'train' / 'images').glob('*'))
        val_images = list((fp_dir / 'val' / 'images').glob('*'))
        
        # Check for checkpoints
        train_checkpoint = fp_dir / '.checkpoint_train.json'
        val_checkpoint = fp_dir / '.checkpoint_val.json'
        
        if train_checkpoint.exists() or val_checkpoint.exists():
            return 'fashionpedia_partial', fp_dir
        elif len(train_images) > 0 and len(val_images) > 0:
            return 'fashionpedia_complete', fp_dir
    
    # Check if any Fashionpedia data exists
    if fp_dir.exists():
        train_dir = fp_dir / 'train' / 'images'
        if train_dir.exists() and len(list(train_dir.glob('*'))) > 0:
            return 'fashionpedia_partial', fp_dir
    
    return 'none', None


def safe_extract_item_data(item):
    """
    Safely extract data from item, handling different dataset structures
    Returns (image_id, image, width, height, objects) or None if invalid
    """
    try:
        # Try direct access first
        if isinstance(item, dict):
            image_id = item.get('image_id')
            image = item.get('image')
            width = item.get('width')
            height = item.get('height')
            objects = item.get('objects', {})
            
            # Validate
            if image_id is None or image is None or width is None or height is None:
                return None
            
            # Handle objects structure
            if isinstance(objects, dict):
                # Objects might be in format {'category': [...], 'bbox': [...]}
                if 'category' in objects and 'bbox' in objects:
                    categories = objects.get('category', [])
                    bboxes = objects.get('bbox', [])
                    
                    # Reconstruct objects list
                    reconstructed_objects = []
                    for i in range(len(categories)):
                        if i < len(bboxes):
                            reconstructed_objects.append({
                                'category': categories[i],
                                'bbox': bboxes[i]
                            })
                    objects = reconstructed_objects
                else:
                    objects = []
            elif not isinstance(objects, list):
                objects = []
            
            return image_id, image, width, height, objects
        else:
            return None
            
    except Exception as e:
        return None


def download_and_convert_fashionpedia(output_dir):
    """Download Fashionpedia and convert to YOLO format"""
    
    print("\n" + "="*60)
    print("Downloading Fashionpedia from HuggingFace")
    print("="*60)
    print("\nDataset Info:")
    print("  Training: ~45,623 images")
    print("  Validation: ~1,158 images")
    print("  Download: ~3.5GB")
    print("  Time: 15-30 minutes\n")
    
    output_dir = Path(output_dir)
    
    # Import here to ensure fresh import
    from datasets import load_dataset
    from tqdm import tqdm
    
    mapping = create_fashionpedia_mapping()
    raincoat_classes = ["top", "bottom", "outerwear", "shoes", "accessories"]
    stats = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, -1: 0}
    
    print("Loading dataset from HuggingFace...")
    print("(This will download ~3.5GB on first run)")
    
    try:
        dataset = load_dataset("detection-datasets/fashionpedia")
    except Exception as e:
        print(f"\nError loading dataset: {e}")
        return None
    
    print(f"\n[OK] Dataset loaded")
    print(f"  Train: {len(dataset['train'])} images")
    print(f"  Val: {len(dataset['val'])} images")
    
    for split_name, split_data in [('train', dataset['train']), ('val', dataset['val'])]:
        print(f"\n{'='*60}")
        print(f"Processing {split_name} split")
        print('='*60)
        
        images_dir = output_dir / split_name / 'images'
        labels_dir = output_dir / split_name / 'labels'
        images_dir.mkdir(parents=True, exist_ok=True)
        labels_dir.mkdir(parents=True, exist_ok=True)
        
        processed = 0
        skipped = 0
        errors = 0
        
        for idx, item in enumerate(tqdm(split_data, desc=f"Converting {split_name}")):
            try:
                # Safely extract data
                extracted = safe_extract_item_data(item)
                
                if extracted is None:
                    errors += 1
                    skipped += 1
                    continue
                
                image_id, image, width, height, objects = extracted
                
                # Validate image
                if image is None or not hasattr(image, 'save'):
                    errors += 1
                    skipped += 1
                    continue
                
                # Validate dimensions
                if width <= 0 or height <= 0:
                    errors += 1
                    skipped += 1
                    continue
                
                # Convert annotations
                valid_annotations = []
                
                for obj in objects:
                    try:
                        if not isinstance(obj, dict):
                            continue
                        
                        category_id = obj.get('category')
                        bbox = obj.get('bbox')
                        
                        if category_id is None or bbox is None:
                            continue
                        
                        raincoat_cat = mapping.get(category_id, -1)
                        
                        if raincoat_cat == -1:
                            stats[-1] += 1
                            continue
                        
                        stats[raincoat_cat] += 1
                        
                        # Validate bbox is a list/tuple of 4 numbers
                        if not (isinstance(bbox, (list, tuple)) and len(bbox) == 4):
                            continue
                        
                        x_min, y_min, x_max, y_max = bbox
                        
                        # Validate bbox values
                        if x_max <= x_min or y_max <= y_min:
                            continue
                        
                        # Convert to YOLO format
                        x_center = ((x_min + x_max) / 2) / width
                        y_center = ((y_min + y_max) / 2) / height
                        box_width = (x_max - x_min) / width
                        box_height = (y_max - y_min) / height
                        
                        # Clamp to [0, 1]
                        x_center = max(0.0, min(1.0, x_center))
                        y_center = max(0.0, min(1.0, y_center))
                        box_width = max(0.0, min(1.0, box_width))
                        box_height = max(0.0, min(1.0, box_height))
                        
                        if box_width > 0 and box_height > 0:
                            valid_annotations.append(
                                f"{raincoat_cat} {x_center:.6f} {y_center:.6f} "
                                f"{box_width:.6f} {box_height:.6f}"
                            )
                    except Exception as e:
                        # Skip bad annotation but continue processing image
                        continue
                
                # Save if we have valid annotations
                if valid_annotations:
                    # Save image
                    img_filename = f"fashionpedia_{image_id:06d}.jpg"
                    image.save(images_dir / img_filename)
                    
                    # Save labels
                    label_filename = f"fashionpedia_{image_id:06d}.txt"
                    with open(labels_dir / label_filename, 'w') as f:
                        f.write('\n'.join(valid_annotations))
                    
                    processed += 1
                else:
                    skipped += 1
                
                # Save checkpoint every 5000 images
                if (idx + 1) % 5000 == 0:
                    checkpoint = {
                        'split': split_name,
                        'processed': processed,
                        'skipped': skipped,
                        'errors': errors,
                        'index': idx + 1
                    }
                    with open(output_dir / f'.checkpoint_{split_name}.json', 'w') as f:
                        json.dump(checkpoint, f)
                    
            except KeyboardInterrupt:
                print(f"\n\nInterrupted at image {idx}")
                print(f"Processed so far: {processed:,} images")
                raise
            
            except Exception as e:
                errors += 1
                skipped += 1
                # Only print first few errors to avoid spam
                if errors <= 10:
                    print(f"\nUnexpected error at index {idx}: {e}")
                continue
        
        print(f"\n[OK] {split_name} complete:")
        print(f"  Saved: {processed:,} images")
        print(f"  Skipped: {skipped:,} images")
        print(f"  Errors: {errors:,}")
    
    # Create data.yaml
    data_yaml = {
        'path': str(output_dir.absolute()),
        'train': 'train/images',
        'val': 'val/images',
        'nc': 5,
        'names': raincoat_classes
    }
    
    with open(output_dir / 'data.yaml', 'w') as f:
        yaml.dump(data_yaml, f, default_flow_style=False)
    
    print("\n" + "="*60)
    print("Category Distribution:")
    print("="*60)
    for i, name in enumerate(raincoat_classes):
        print(f"  {name:12} {stats[i]:6,} items")
    print(f"  {'ignored':12} {stats[-1]:6,} items")
    
    return output_dir


def merge_datasets(fashionpedia_dir, modanet_dir, output_dir):
    """Merge Fashionpedia and ModaNet"""
    
    print("\n" + "="*60)
    print("Merging Datasets")
    print("="*60)
    
    from tqdm import tqdm
    
    fashionpedia_dir = Path(fashionpedia_dir)
    modanet_dir = Path(modanet_dir)
    output_dir = Path(output_dir)
    
    raincoat_classes = ["top", "bottom", "outerwear", "shoes", "accessories"]
    
    for split in ['train', 'valid']:
        (output_dir / split / 'images').mkdir(parents=True, exist_ok=True)
        (output_dir / split / 'labels').mkdir(parents=True, exist_ok=True)
    
    total = {'train': 0, 'valid': 0}
    
    # Copy ModaNet
    print("\n1. Copying ModaNet...")
    for split in ['train', 'valid']:
        src_img = modanet_dir / split / 'images'
        src_lbl = modanet_dir / split / 'labels'
        
        if not src_img.exists():
            continue
        
        images = list(src_img.glob('*.*'))
        print(f"  {split}: {len(images):,} images")
        
        for img in tqdm(images, desc=f"  Copying {split}"):
            shutil.copy2(img, output_dir / split / 'images' / f"modanet_{img.name}")
            
            lbl = src_lbl / f"{img.stem}.txt"
            if lbl.exists():
                shutil.copy2(lbl, output_dir / split / 'labels' / f"modanet_{img.stem}.txt")
        
        total[split] += len(images)
    
    # Copy Fashionpedia
    print("\n2. Copying Fashionpedia...")
    for fp_split, out_split in [('train', 'train'), ('val', 'valid')]:
        src_img = fashionpedia_dir / fp_split / 'images'
        src_lbl = fashionpedia_dir / fp_split / 'labels'
        
        if not src_img.exists():
            continue
        
        images = list(src_img.glob('*.jpg'))
        print(f"  {fp_split}: {len(images):,} images")
        
        for img in tqdm(images, desc=f"  Copying {fp_split}"):
            shutil.copy2(img, output_dir / out_split / 'images' / img.name)
            
            lbl = src_lbl / f"{img.stem}.txt"
            if lbl.exists():
                shutil.copy2(lbl, output_dir / out_split / 'labels' / lbl.name)
        
        total[out_split] += len(images)
    
    # Create data.yaml
    data_yaml = {
        'path': str(output_dir.absolute()),
        'train': 'train/images',
        'val': 'valid/images',
        'nc': 5,
        'names': raincoat_classes
    }
    
    with open(output_dir / 'data.yaml', 'w') as f:
        yaml.dump(data_yaml, f, default_flow_style=False)
    
    print("\n" + "="*60)
    print("Merged Dataset Summary:")
    print("="*60)
    print(f"  Training: {total['train']:,} images")
    print(f"  Validation: {total['valid']:,} images")
    print(f"  Total: {sum(total.values()):,} images")
    
    return output_dir

def train_model(dataset_path, epochs=50, batch=16, resume=False):
    """Train YOLOv8n with GPU and RAM memory optimization"""
    
    from ultralytics import YOLO
    import torch
    import psutil
    
    print("\n" + "="*60)
    print("Training YOLOv8n")
    print("="*60)
    
    # Check system resources
    ram_gb = psutil.virtual_memory().total / (1024**3)
    ram_available_gb = psutil.virtual_memory().available / (1024**3)
    print(f"\nSystem RAM: {ram_gb:.1f} GB total, {ram_available_gb:.1f} GB available")
    
    # Check for existing training checkpoint
    last_checkpoint = Path("runs/raincoat_merged/raincoat_merged/weights/last.pt")
    
    if last_checkpoint.exists() and not resume:
        print(f"\n[INFO] Found existing training checkpoint: {last_checkpoint}")
        response = input("Resume from checkpoint? (Y/n): ").strip().lower()
        if response in ['', 'y']:
            resume = True
    
    device = 0 if torch.cuda.is_available() else 'cpu'
    
    # Auto-adjust batch size and workers based on available memory
    if device == 0:
        gpu_memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"GPU Memory: {gpu_memory_gb:.1f} GB")
        
        # Recommend batch size based on GPU memory
        if gpu_memory_gb < 6:
            recommended_batch = 4
        elif gpu_memory_gb < 8:
            recommended_batch = 8
        elif gpu_memory_gb < 12:
            recommended_batch = 12
        else:
            recommended_batch = 16
        
        if batch > recommended_batch:
            print(f"\n[WARNING] Batch size {batch} may be too large for {gpu_memory_gb:.1f}GB GPU")
            print(f"          Recommended: {recommended_batch}")
            
            response = input(f"Use recommended batch size {recommended_batch}? (Y/n): ").strip().lower()
            if response in ['', 'y']:
                batch = recommended_batch
        
        # Set PyTorch memory optimization
        os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'
        
    else:
        print("\nDevice: CPU")
        print("[WARNING] Training on CPU will be very slow (24+ hours)")
    
    # Determine worker count based on RAM
    # Each worker loads images into RAM, so fewer workers = less RAM usage
    if ram_available_gb < 8:
        workers = 0  # Single-threaded loading (slowest but uses least RAM)
        print("\n[WARNING] Low RAM detected. Using single-threaded data loading.")
    elif ram_available_gb < 16:
        workers = 1  # Minimal workers
        print("\n[INFO] Limited RAM. Using 1 worker for data loading.")
    else:
        workers = 2  # Standard for this dataset size
    
    print(f"\nTraining Configuration:")
    print(f"  Epochs: {epochs}")
    print(f"  Batch: {batch}")
    print(f"  Workers: {workers}")
    print(f"  Device: {device}")
    
    if resume:
        print(f"\n[INFO] Resuming from checkpoint: {last_checkpoint}")
        model = YOLO(str(last_checkpoint))
    else:
        print("\n[INFO] Starting fresh training")
        model = YOLO("yolov8n.pt")
    
    # Ultra memory-efficient training settings
    results = model.train(
        data=str(Path(dataset_path) / 'data.yaml'),
        epochs=epochs,
        imgsz=640,
        batch=batch,
        name="raincoat_merged",
        patience=15,
        device=device,
        project="runs/raincoat_merged",
        exist_ok=True,
        resume=resume,
        
        # CRITICAL: Memory optimization settings
        workers=workers,  # Reduce based on available RAM
        cache=False,  # NEVER cache with large datasets - uses too much RAM
        amp=True,  # Automatic mixed precision (reduces GPU memory)
        
        # Close images after loading to free RAM
        close_mosaic=10,  # Disable mosaic augmentation in last 10 epochs to save memory
        
        # Training settings
        pretrained=True if not resume else False,
        optimizer='AdamW',
        lr0=0.001,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3,
        
        # Reduce augmentation intensity to lower processing overhead
        hsv_h=0.01,  # Reduced from 0.015
        hsv_s=0.5,   # Reduced from 0.7
        hsv_v=0.3,   # Reduced from 0.4
        degrees=0.0,
        translate=0.05,  # Reduced from 0.1
        scale=0.3,       # Reduced from 0.5
        shear=0.0,
        perspective=0.0,
        flipud=0.0,
        fliplr=0.5,
        mosaic=0.5,      # Reduced from 1.0 (mosaic is RAM-heavy)
        mixup=0.0,
        
        # Additional memory-saving options
        rect=False,  # Don't use rectangular training (saves a bit of RAM)
        single_cls=False,
    )
    
    best = Path("runs/raincoat_merged/raincoat_merged/weights/best.pt")
    print(f"\n[OK] Training complete: {best}")
    
    # Clear memory after training
    if device == 0:
        torch.cuda.empty_cache()
    
    return model, best


def export_onnx(model, output_dir="models"):
    """Export to ONNX"""
    
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    print("\nExporting to ONNX...")
    onnx = model.export(format="onnx", imgsz=640, simplify=True, opset=14)
    
    final = output_dir / "raincoat_fashion_yolov8n.onnx"
    Path(onnx).rename(final)
    
    size_mb = final.stat().st_size / (1024 * 1024)
    print(f"[OK] ONNX: {final} ({size_mb:.1f}MB)")
    
    return final

def main():
    print("="*60)
    print("Fashionpedia + ModaNet Training Pipeline")
    print("="*60)
    
    install_dependencies()
    
    fp_dir = Path("datasets/fashionpedia_hf")
    mn_dir = Path("datasets")
    merged_dir = Path("datasets/merged_fashion")
    
    # Check current status
    print("\nChecking pipeline status...")
    status, data_path = check_dataset_status(fp_dir, merged_dir)
    
    print(f"\nCurrent status: {status}")
    
    if status == 'trained':
        print(f"\n[OK] Training already complete!")
        print(f"     Model: {data_path}")
        
        response = input("\nExport to ONNX? (Y/n): ").strip().lower()
        if response in ['', 'y']:
            from ultralytics import YOLO
            model = YOLO(str(data_path))
            onnx = export_onnx(model)
            print(f"\n[OK] ONNX exported: {onnx}")
        return 0
    
    elif status == 'merged':
        print(f"\n[OK] Datasets already merged: {data_path}")
        print("     Ready to train!")
        
        response = input("\nStart training now? (Y/n): ").strip().lower()
        if response in ['', 'y']:
            epochs = int(input("Epochs (50): ") or "50")
            batch = int(input("Batch (16): ") or "16")
            
            model, weights = train_model(data_path, epochs, batch)
            onnx = export_onnx(model)
            
            print("\n" + "="*60)
            print("SUCCESS!")
            print("="*60)
            print(f"[OK] Model: {onnx}")
        return 0
    
    elif status == 'fashionpedia_complete':
        print(f"\n[OK] Fashionpedia downloaded: {data_path}")
        print("     Ready to merge with ModaNet")
        
        response = input("\nMerge datasets now? (Y/n): ").strip().lower()
        if response in ['', 'y']:
            merged_dir = merge_datasets(data_path, mn_dir, merged_dir)
            
            response = input("\nStart training now? (Y/n): ").strip().lower()
            if response in ['', 'y']:
                epochs = int(input("Epochs (50): ") or "50")
                batch = int(input("Batch (16): ") or "16")
                
                model, weights = train_model(merged_dir, epochs, batch)
                onnx = export_onnx(model)
                
                print("\n" + "="*60)
                print("SUCCESS!")
                print("="*60)
                print(f"[OK] Model: {onnx}")
        return 0
    
    elif status == 'fashionpedia_partial':
        print(f"\n[WARNING] Fashionpedia download incomplete!")
        print(f"          Found partial data at: {data_path}")
        print("\nOptions:")
        print("  1. Continue download (may have issues)")
        print("  2. Delete and restart download")
        print("  3. Exit")
        
        choice = input("\nChoice (1/2/3): ").strip()
        
        if choice == '2':
            shutil.rmtree(fp_dir)
            print("\n[OK] Deleted partial download")
            fp_dir = download_and_convert_fashionpedia(fp_dir)
        elif choice == '3':
            return 0
        else:
            print("\n[WARNING] Continuing with partial data may cause issues")
            fp_dir = data_path
    
    else:  # status == 'none'
        print("\n[INFO] Starting from scratch")
        
        # Check ModaNet exists
        if not (mn_dir / 'train').exists():
            print(f"\n[ERROR] ModaNet not found at: {mn_dir}")
            return 1
        
        # Download Fashionpedia
        fp_dir = download_and_convert_fashionpedia(fp_dir)
        
        if fp_dir is None:
            print("\n[ERROR] Failed to download Fashionpedia")
            return 1
        
        # Merge
        merged_dir = merge_datasets(fp_dir, mn_dir, merged_dir)
        
        # Train
        response = input("\nStart training? (Y/n): ").strip().lower()
        if response in ['', 'y']:
            epochs = int(input("Epochs (50): ") or "50")
            batch = int(input("Batch (16): ") or "16")
            
            model, weights = train_model(merged_dir, epochs, batch)
            onnx = export_onnx(model)
            
            print("\n" + "="*60)
            print("SUCCESS!")
            print("="*60)
            print(f"[OK] Model: {onnx}")
    
    return 0


if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\nInterrupted")
        print("\n[INFO] Progress saved. Run script again to resume.")
        exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        exit(1)