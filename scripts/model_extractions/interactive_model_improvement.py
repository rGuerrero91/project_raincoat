"""
Interactive Model Improvement with User Corrections
Collects user corrections and retrains model periodically
Complete script with robust error handling
"""

import sys
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont
import shutil
from datetime import datetime

def install_dependencies():
    """Install required packages"""
    packages = ['ultralytics', 'Pillow']
    
    for package in packages:
        try:
            if package == 'ultralytics':
                import ultralytics
            elif package == 'Pillow':
                from PIL import Image
            print(f"[OK] {package}")
        except ImportError:
            print(f"Installing {package}...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])


class CorrectionManager:
    """Manages user corrections and creates training data"""
    
    def __init__(self, corrections_dir="user_corrections"):
        self.corrections_dir = Path(corrections_dir)
        self.corrections_dir.mkdir(exist_ok=True)
        
        self.images_dir = self.corrections_dir / 'images'
        self.labels_dir = self.corrections_dir / 'labels'
        self.images_dir.mkdir(exist_ok=True)
        self.labels_dir.mkdir(exist_ok=True)
        
        self.log_file = self.corrections_dir / 'corrections_log.json'
        self.corrections = self.load_corrections()
        
        self.category_map = {
            'top': 0,
            'bottom': 1,
            'outerwear': 2,
            'shoes': 3,
            'accessories': 4
        }
    
    def load_corrections(self):
        """Load existing corrections log"""
        if self.log_file.exists():
            with open(self.log_file, 'r') as f:
                return json.load(f)
        return []
    
    def save_corrections(self):
        """Save corrections log"""
        with open(self.log_file, 'w') as f:
            json.dump(self.corrections, f, indent=2)
    
    def add_correction(self, image_path, predicted_category, correct_category, bbox, confidence):
        """
        Add a user correction
        
        Args:
            image_path: Path to original image
            predicted_category: What model predicted
            correct_category: What user corrected to
            bbox: Bounding box [x1, y1, x2, y2]
            confidence: Model's confidence
        """
        
        image_path = Path(image_path)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"{image_path.stem}_{timestamp}"
        
        # Copy image
        new_image_path = self.images_dir / f"{base_name}.jpg"
        shutil.copy2(image_path, new_image_path)
        
        # Create YOLO format label
        # Convert bbox to YOLO format (normalized x_center, y_center, width, height)
        img = Image.open(image_path)
        img_width, img_height = img.size
        
        x1, y1, x2, y2 = bbox
        x_center = ((x1 + x2) / 2) / img_width
        y_center = ((y1 + y2) / 2) / img_height
        width = (x2 - x1) / img_width
        height = (y2 - y1) / img_height
        
        class_id = self.category_map[correct_category]
        
        # Write label file
        label_path = self.labels_dir / f"{base_name}.txt"
        with open(label_path, 'w') as f:
            f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")
        
        # Log correction
        correction = {
            'timestamp': timestamp,
            'original_image': str(image_path),
            'new_image': str(new_image_path),
            'predicted': predicted_category,
            'corrected_to': correct_category,
            'confidence': confidence,
            'bbox': bbox
        }
        
        self.corrections.append(correction)
        self.save_corrections()
        
        print(f"\n[SAVED] Correction added to training data")
        print(f"        Total corrections: {len(self.corrections)}")
        
        return correction
    
    def get_stats(self):
        """Get statistics about corrections"""
        stats = {
            'total': len(self.corrections),
            'by_category': {},
            'common_mistakes': {}
        }
        
        for corr in self.corrections:
            corrected = corr['corrected_to']
            stats['by_category'][corrected] = stats['by_category'].get(corrected, 0) + 1
            
            mistake = (corr['predicted'], corr['corrected_to'])
            stats['common_mistakes'][mistake] = stats['common_mistakes'].get(mistake, 0) + 1
        
        return stats
    
    def create_training_dataset(self, output_dir="datasets/user_corrections_dataset"):
        """
        Create a YOLO training dataset from corrections
        
        Returns path to dataset
        """
        output_dir = Path(output_dir)
        
        # Create directory structure
        for split in ['train', 'valid']:
            (output_dir / split / 'images').mkdir(parents=True, exist_ok=True)
            (output_dir / split / 'labels').mkdir(parents=True, exist_ok=True)
        
        # Split 80/20 train/valid
        import random
        images = list(self.images_dir.glob('*.jpg'))
        random.shuffle(images)
        
        split_idx = int(len(images) * 0.8)
        train_images = images[:split_idx]
        valid_images = images[split_idx:]
        
        # Copy files
        for img_path in train_images:
            shutil.copy2(img_path, output_dir / 'train' / 'images' / img_path.name)
            label_path = self.labels_dir / f"{img_path.stem}.txt"
            if label_path.exists():
                shutil.copy2(label_path, output_dir / 'train' / 'labels' / label_path.name)
        
        for img_path in valid_images:
            shutil.copy2(img_path, output_dir / 'valid' / 'images' / img_path.name)
            label_path = self.labels_dir / f"{img_path.stem}.txt"
            if label_path.exists():
                shutil.copy2(label_path, output_dir / 'valid' / 'labels' / label_path.name)
        
        # Create data.yaml
        import yaml
        data_yaml = {
            'path': str(output_dir.absolute()),
            'train': 'train/images',
            'val': 'valid/images',
            'nc': 5,
            'names': ['top', 'bottom', 'outerwear', 'shoes', 'accessories']
        }
        
        with open(output_dir / 'data.yaml', 'w') as f:
            yaml.dump(data_yaml, f, default_flow_style=False)
        
        print(f"\n[OK] Training dataset created: {output_dir}")
        print(f"     Train: {len(train_images)} images")
        print(f"     Valid: {len(valid_images)} images")
        
        return output_dir


def load_model(model_path):
    """Load trained YOLO model"""
    from ultralytics import YOLO
    
    print(f"\nLoading model: {model_path}")
    model = YOLO(str(model_path))
    print("[OK] Model loaded")
    
    return model


def get_category_name(class_id):
    """Convert class ID to category name"""
    categories = {0: "top", 1: "bottom", 2: "outerwear", 3: "shoes", 4: "accessories"}
    return categories.get(class_id, "unknown")


def get_category_color(class_id):
    """Get color for each category"""
    colors = {
        0: (255, 100, 100),  # top - red
        1: (100, 100, 255),  # bottom - blue
        2: (255, 200, 100),  # outerwear - orange
        3: (100, 255, 100),  # shoes - green
        4: (255, 100, 255),  # accessories - purple
    }
    return colors.get(class_id, (128, 128, 128))


def detect_clothing(model, image_path, conf_threshold=0.25):
    """Run detection on an image with error handling"""
    try:
        # Validate image can be opened
        try:
            img = Image.open(image_path)
            img.verify()  # Verify it's a valid image
            img = Image.open(image_path)  # Reopen after verify
        except Exception as e:
            raise ValueError(f"Cannot open image: {e}")
        
        # Run detection
        results = model.predict(
            source=str(image_path),
            conf=conf_threshold,
            verbose=False
        )
        
        detections = []
        if len(results) > 0:
            result = results[0]
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes.cpu().numpy()
                
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0]
                    conf = float(box.conf[0])
                    class_id = int(box.cls[0])
                    area = (x2 - x1) * (y2 - y1)
                    
                    detections.append({
                        'class_id': class_id,
                        'category': get_category_name(class_id),
                        'confidence': conf,
                        'bbox': [float(x1), float(y1), float(x2), float(y2)],
                        'area': float(area)
                    })
        
        # Sort by area (largest first) then confidence
        detections.sort(key=lambda x: (x['area'], x['confidence']), reverse=True)
        
        return detections
    
    except Exception as e:
        raise Exception(f"Detection error: {e}")


def visualize_detections(image_path, detections, output_path):
    """Draw bounding boxes and labels on image"""
    
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    for det in detections:
        x1, y1, x2, y2 = det['bbox']
        category = det['category']
        confidence = det['confidence']
        color = get_category_color(det['class_id'])
        
        # Draw bounding box
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        
        # Draw label background
        label = f"{category}: {confidence:.2f}"
        bbox = draw.textbbox((x1, y1 - 25), label, font=font)
        draw.rectangle(bbox, fill=color)
        
        # Draw label text
        draw.text((x1, y1 - 25), label, fill=(255, 255, 255), font=font)
    
    img.save(output_path)
    print(f"[OK] Visualization saved: {output_path}")


def interactive_correction_session(model, correction_manager):
    """Interactive session where user can correct predictions"""
    
    print("\n" + "="*60)
    print("INTERACTIVE CORRECTION SESSION")
    print("="*60)
    print("\nTest images and correct mistakes to improve the model")
    print("\nCommands:")
    print("  retrain  - Retrain model with corrections")
    print("  stats    - See correction statistics")
    print("  help     - Show this help")
    print("  quit     - Exit session")
    print("\nOr provide an image path to test\n")
    
    categories = ['top', 'bottom', 'outerwear', 'shoes', 'accessories']
    
    while True:
        try:
            command = input("\nImage path (or command): ").strip()
            
            # Handle empty input
            if not command:
                print("[INFO] Please enter a command or image path")
                continue
            
            # Quit command
            if command.lower() in ['quit', 'exit', 'q']:
                print("\n[OK] Exiting session...")
                break
            
            # Help command
            elif command.lower() in ['help', 'h', '?']:
                print("\n" + "="*60)
                print("HELP")
                print("="*60)
                print("\nCommands:")
                print("  retrain  - Retrain model with your corrections")
                print("  stats    - View correction statistics")
                print("  help     - Show this help message")
                print("  quit     - Exit the session")
                print("\nOr enter an image file path to test detection")
                print("\nExample paths:")
                print("  C:/Users/Name/Pictures/shirt.jpg")
                print("  ./test_images/hat.png")
                print("  notes_and_test_data/test_images/shoes.jpg")
                continue
            
            # Stats command
            elif command.lower() == 'stats':
                try:
                    stats = correction_manager.get_stats()
                    print("\n" + "="*60)
                    print("CORRECTION STATISTICS")
                    print("="*60)
                    print(f"\nTotal corrections: {stats['total']}")
                    
                    if stats['by_category']:
                        print("\nCorrections by category:")
                        for cat, count in sorted(stats['by_category'].items()):
                            print(f"  {cat:12} {count}")
                    
                    if stats['common_mistakes']:
                        print("\nMost common mistakes:")
                        for (pred, corr), count in sorted(stats['common_mistakes'].items(), 
                                                          key=lambda x: x[1], reverse=True)[:5]:
                            print(f"  {pred} → {corr}: {count} times")
                    
                    if stats['total'] == 0:
                        print("\nNo corrections yet. Test some images and correct mistakes!")
                except Exception as e:
                    print(f"\n[ERROR] Failed to load stats: {e}")
                
                continue
            
            # Retrain command
            elif command.lower() == 'retrain':
                try:
                    if len(correction_manager.corrections) == 0:
                        print("\n[INFO] No corrections yet. Add some corrections first!")
                        continue
                    
                    if len(correction_manager.corrections) < 10:
                        print(f"\n[WARNING] Only {len(correction_manager.corrections)} corrections")
                        print("          Recommend at least 10-20 corrections before retraining")
                        response = input("Continue anyway? (y/N): ").strip().lower()
                        if response != 'y':
                            continue
                    
                    retrain_with_corrections(model, correction_manager)
                except Exception as e:
                    print(f"\n[ERROR] Retraining failed: {e}")
                    import traceback
                    traceback.print_exc()
                    print("\nReturning to main menu...")
                
                continue
            
            # Process as image path
            image_path = Path(command)
            
            # Validate path
            if not image_path.exists():
                print(f"\n[ERROR] File not found: {image_path}")
                print("\nTips:")
                print("  - Check the file path is correct")
                print("  - Use forward slashes (/) or double backslashes (\\\\)")
                print("  - Wrap path in quotes if it contains spaces")
                print("  - Type 'help' for more information")
                continue
            
            # Check if it's an image file
            valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
            if image_path.suffix.lower() not in valid_extensions:
                print(f"\n[WARNING] '{image_path.suffix}' may not be a valid image format")
                response = input("Try anyway? (y/N): ").strip().lower()
                if response != 'y':
                    continue
            
            # Run detection
            try:
                print("\nRunning detection...")
                detections = detect_clothing(model, image_path)
                
                if len(detections) == 0:
                    print("\n[RESULT] No items detected")
                    print("         The image may not contain recognizable clothing")
                    print("         Or the clothing item is too small/unclear")
                    continue
                
                # Show top detection
                top_det = detections[0]
                print(f"\n[DETECTED] {top_det['category'].upper()} (confidence: {top_det['confidence']:.1%})")
                
                if len(detections) > 1:
                    print("\nAlternatives:")
                    for i, det in enumerate(detections[1:4], 1):
                        print(f"  {i}. {det['category']}: {det['confidence']:.1%}")
                
            except Exception as e:
                print(f"\n[ERROR] Detection failed: {e}")
                print("        This could be due to:")
                print("        - Corrupted image file")
                print("        - Incompatible image format")
                print("        - Model error")
                import traceback
                traceback.print_exc()
                continue
            
            # Ask if correct
            try:
                response = input("\nIs this correct? (y/n/skip): ").strip().lower()
                
                if response in ['skip', 's', '']:
                    print("[SKIPPED]")
                    continue
                
                if response in ['n', 'no']:
                    print("\nWhat should it be?")
                    for i, cat in enumerate(categories, 1):
                        print(f"  {i}. {cat}")
                    
                    choice = input("Choice (1-5, or 'cancel'): ").strip()
                    
                    if choice.lower() in ['cancel', 'c', 'skip', '']:
                        print("[CANCELLED]")
                        continue
                    
                    if not choice.isdigit():
                        print(f"[ERROR] Invalid choice: '{choice}'")
                        print("        Please enter a number 1-5")
                        continue
                    
                    choice_num = int(choice)
                    if not (1 <= choice_num <= 5):
                        print(f"[ERROR] Choice must be between 1-5, got: {choice_num}")
                        continue
                    
                    correct_category = categories[choice_num - 1]
                    
                    # Save correction
                    try:
                        correction_manager.add_correction(
                            image_path,
                            top_det['category'],
                            correct_category,
                            top_det['bbox'],
                            top_det['confidence']
                        )
                        
                        print(f"\n[CORRECTED] {top_det['category']} → {correct_category}")
                        
                    except Exception as e:
                        print(f"\n[ERROR] Failed to save correction: {e}")
                        import traceback
                        traceback.print_exc()
                        continue
                    
                elif response in ['y', 'yes']:
                    print("[OK] Prediction confirmed")
                else:
                    print(f"[INFO] Unrecognized response: '{response}'")
                    print("       Use 'y' for yes, 'n' for no, or 'skip' to skip")
            
            except Exception as e:
                print(f"\n[ERROR] Input processing failed: {e}")
                continue
        
        except KeyboardInterrupt:
            print("\n\n[INFO] Interrupted. Type 'quit' to exit or continue testing.")
            continue
        
        except Exception as e:
            print(f"\n[ERROR] Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            print("\nReturning to main menu...")
            continue


def retrain_with_corrections(model, correction_manager):
    """Retrain model incorporating user corrections with error handling"""
    
    try:
        print("\n" + "="*60)
        print("RETRAINING WITH USER CORRECTIONS")
        print("="*60)
        
        # Create dataset from corrections
        try:
            corrections_dataset = correction_manager.create_training_dataset()
        except Exception as e:
            print(f"\n[ERROR] Failed to create training dataset: {e}")
            raise
        
        # Option 1: Fine-tune existing model (recommended)
        print("\nRetraining options:")
        print("  1. Fine-tune current model (fast, 5-10 epochs)")
        print("  2. Merge with full dataset and retrain (slow, better results)")
        print("  0. Cancel")
        
        choice = input("\nChoice (0/1/2): ").strip()
        
        if choice == '0' or choice.lower() in ['cancel', 'c']:
            print("[CANCELLED] Retraining aborted")
            return model
        
        if choice == '1':
            # Quick fine-tuning on corrections only
            epochs_input = input("Epochs (10): ").strip()
            epochs = int(epochs_input) if epochs_input.isdigit() else 10
            
            print(f"\nFine-tuning model on {len(correction_manager.corrections)} corrections...")
            print("This will take 5-15 minutes...")
            
            try:
                results = model.train(
                    data=str(corrections_dataset / 'data.yaml'),
                    epochs=epochs,
                    imgsz=640,
                    batch=4,
                    name="raincoat_corrected",
                    patience=5,
                    project="runs/raincoat_corrections",
                    exist_ok=True,
                    pretrained=False,
                    
                    # Conservative settings
                    lr0=0.0001,
                    lrf=0.001,
                    weight_decay=0.001,
                    
                    # Minimal augmentation
                    hsv_h=0.01,
                    hsv_s=0.3,
                    hsv_v=0.3,
                    mosaic=0.0,
                    mixup=0.0,
                    
                    workers=1,
                    cache=False,
                )
                
                new_model_path = Path("runs/raincoat_corrections/raincoat_corrected/weights/best.pt")
                
            except Exception as e:
                print(f"\n[ERROR] Training failed: {e}")
                raise
            
        elif choice == '2':
            # Merge corrections with full dataset
            print("\nMerging corrections with full training dataset...")
            
            original_dataset = Path("datasets/merged_fashion")
            if not original_dataset.exists():
                print(f"\n[ERROR] Original dataset not found: {original_dataset}")
                return model
            
            merged_dataset = Path("datasets/merged_with_corrections")
            
            try:
                # Create merged dataset
                for split in ['train', 'valid']:
                    (merged_dataset / split / 'images').mkdir(parents=True, exist_ok=True)
                    (merged_dataset / split / 'labels').mkdir(parents=True, exist_ok=True)
                    
                    # Copy original dataset
                    for img in (original_dataset / split / 'images').glob('*'):
                        shutil.copy2(img, merged_dataset / split / 'images' / img.name)
                    for lbl in (original_dataset / split / 'labels').glob('*'):
                        shutil.copy2(lbl, merged_dataset / split / 'labels' / lbl.name)
                    
                    # Add corrections
                    for img in (corrections_dataset / split / 'images').glob('*'):
                        shutil.copy2(img, merged_dataset / split / 'images' / f"correction_{img.name}")
                    for lbl in (corrections_dataset / split / 'labels').glob('*'):
                        shutil.copy2(lbl, merged_dataset / split / 'labels' / f"correction_{lbl.name}")
                
                # Create data.yaml
                import yaml
                data_yaml = {
                    'path': str(merged_dataset.absolute()),
                    'train': 'train/images',
                    'val': 'valid/images',
                    'nc': 5,
                    'names': ['top', 'bottom', 'outerwear', 'shoes', 'accessories']
                }
                with open(merged_dataset / 'data.yaml', 'w') as f:
                    yaml.dump(data_yaml, f, default_flow_style=False)
                
            except Exception as e:
                print(f"\n[ERROR] Failed to merge datasets: {e}")
                raise
            
            epochs_input = input("Epochs (20): ").strip()
            epochs = int(epochs_input) if epochs_input.isdigit() else 20
            
            batch_input = input("Batch (8): ").strip()
            batch = int(batch_input) if batch_input.isdigit() else 8
            
            print(f"\nRetraining on full dataset + corrections...")
            print("This will take 2-4 hours...")
            
            try:
                from ultralytics import YOLO
                fresh_model = YOLO("yolov8n.pt")
                
                results = fresh_model.train(
                    data=str(merged_dataset / 'data.yaml'),
                    epochs=epochs,
                    imgsz=640,
                    batch=batch,
                    name="raincoat_with_corrections",
                    patience=10,
                    project="runs/raincoat_corrections",
                    workers=1,
                    cache=False,
                )
                
                new_model_path = Path("runs/raincoat_corrections/raincoat_with_corrections/weights/best.pt")
                
            except Exception as e:
                print(f"\n[ERROR] Training failed: {e}")
                raise
        
        else:
            print(f"[ERROR] Invalid choice: '{choice}'")
            return model
        
        print("\n" + "="*60)
        print("RETRAINING COMPLETE")
        print("="*60)
        print(f"\n[OK] New model saved: {new_model_path}")
        print("\nTo use the updated model:")
        print(f"  1. Copy to: models/raincoat_improved.pt")
        print(f"  2. Or replace: runs/raincoat_merged/raincoat_merged/weights/best.pt")
        
        # Offer to test improvements
        response = input("\nTest improved model now? (Y/n): ").strip().lower()
        if response in ['', 'y']:
            try:
                improved_model = load_model(new_model_path)
                return improved_model
            except Exception as e:
                print(f"\n[ERROR] Failed to load improved model: {e}")
                return model
        
        return model
    
    except Exception as e:
        print(f"\n[ERROR] Retraining process failed: {e}")
        import traceback
        traceback.print_exc()
        return model


def main():
    print("="*60)
    print("Interactive Model Improvement System")
    print("="*60)
    
    install_dependencies()
    
    # Find model
    model_path = Path("runs/raincoat_merged/raincoat_merged/weights/best.pt")
    
    if not model_path.exists():
        print(f"\n[ERROR] Model not found: {model_path}")
        print("        Please train the model first")
        return 1
    
    # Load model
    try:
        model = load_model(model_path)
    except Exception as e:
        print(f"\n[ERROR] Failed to load model: {e}")
        return 1
    
    # Initialize correction manager
    try:
        correction_manager = CorrectionManager()
        existing_corrections = len(correction_manager.corrections)
        if existing_corrections > 0:
            print(f"\n[INFO] Found {existing_corrections} existing corrections")
    except Exception as e:
        print(f"\n[ERROR] Failed to initialize correction manager: {e}")
        return 1
    
    # Start interactive session with error handling
    try:
        interactive_correction_session(model, correction_manager)
    except Exception as e:
        print(f"\n[ERROR] Session error: {e}")
        import traceback
        traceback.print_exc()
    
    # Final summary
    try:
        stats = correction_manager.get_stats()
        if stats['total'] > 0:
            print("\n" + "="*60)
            print(f"SESSION COMPLETE - {stats['total']} total corrections")
            print("="*60)
            
            if stats['total'] >= 10:
                print("\nYou have enough corrections to retrain!")
                response = input("Retrain now? (Y/n): ").strip().lower()
                if response in ['', 'y']:
                    try:
                        retrain_with_corrections(model, correction_manager)
                    except Exception as e:
                        print(f"\n[ERROR] Retraining failed: {e}")
                        import traceback
                        traceback.print_exc()
    except Exception as e:
        print(f"\n[ERROR] Summary error: {e}")
    
    print("\n[OK] Session ended")
    return 0


if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\nInterrupted")
        exit(1)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        exit(1)