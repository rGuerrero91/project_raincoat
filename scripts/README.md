# Local CI Scripts

Run the same checks that GitHub Actions runs, but on your local machine. This helps you catch issues before pushing to GitHub.

## Quick Start

### Run All CI Checks (Recommended before pushing)

```bash
npm run ci
```

Or:

```bash
./scripts/ci-local-all.sh
```

### Run Only Frontend Checks

```bash
npm run ci:frontend
```

Or:

```bash
./scripts/ci-local-frontend.sh
```

### Run Only Backend Checks

```bash
npm run ci:backend
```

Or:

```bash
./scripts/ci-local-backend.sh
```

### During Development (Faster Feedback)

```bash
# Frontend only
cd raincoat_frontend
npm run lint        # Just ESLint
npm test            # Just tests (watch mode)

# Backend only
cd raincoat_api
bundle exec rubocop # Just RuboCop
bundle exec rspec   # Just tests
```

### Using Docker

If you have PostgreSQL/Redis in Docker:

```bash
# Start services
docker compose -f docker-compose.dev.yaml up -d

# Run CI
npm run ci:backend
```

## Troubleshooting

### "Permission denied" Error

```bash
chmod +x scripts/*.sh
```

### "Database does not exist" Error

```bash
cd raincoat_api
RAILS_ENV=test bundle exec rake db:create
```

### "jq: command not found" (Brakeman check)

Install jq:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

Or the script will skip the security check gracefully.

## Exit Codes

- **0**: All checks passed
- **1**: One or more checks failed

## Performance

- **Frontend CI**: ~2-3 minutes
- **Backend CI**: ~1-2 minutes
- **Total**: ~3-5 minutes

Much faster than waiting for GitHub Actions (which also has queue time).

---

## All Available Scripts

### CI/Testing Scripts

#### `ci-local-frontend.sh`

Runs complete frontend CI pipeline locally (ESLint, Prettier, TypeScript, Jest, Build).

```bash
./scripts/ci-local-frontend.sh
# or: npm run ci:frontend
```

#### `ci-local-backend.sh`

Runs complete backend CI pipeline locally (RuboCop, Brakeman, RSpec).

```bash
./scripts/ci-local-backend.sh
# or: npm run ci:backend
```

#### `ci-local-all.sh`

Runs both frontend and backend CI checks sequentially.

```bash
./scripts/ci-local-all.sh
# or: npm run ci
```

---

### Docker Utilities

#### `reset_docker.sh`

Resets Docker environment by stopping all containers, removing volumes, and cleaning up.

```bash
./scripts/reset_docker.sh
```

**Use case**: When you need a clean Docker slate (database issues, volume corruption, etc.)

---

### 🖼️ Image Processing

#### `process_seed_images.py`

Processes seed images for the database, likely resizing/optimizing for model training.

```bash
python scripts/process_seed_images.py
```

**Requirements**: Python 3.x, PIL/Pillow

---

### Model Extraction Scripts

Located in `scripts/model_extraction_scripts/`:

#### YOLO (Object Detection)

**`yolo_export_only.py`**

- Exports YOLO model to ONNX format for deployment

```bash
python scripts/model_extraction_scripts/yolo_export_only.py
```

**`yolo_full_process.py`**

- Complete YOLO pipeline: training, validation, and export

```bash
python scripts/model_extraction_scripts/yolo_full_process.py
```

**`yolo_interactive_model_improvement.py`**

- Interactive tool for improving YOLO model with manual review

```bash
python scripts/model_extraction_scripts/yolo_interactive_model_improvement.py
```

#### U2-Net (Background Removal)

**`u2net_onnx_extract.py`**

- Exports U2-Net model to ONNX format FP32

```bash
python scripts/model_extraction_scripts/u2net_onnx_extract.py
```

**`u2net_quantized/u2net_onnx_export_v2.py`**

- Exports quantized (optimized) version of U2-Net model FP16

```bash
python scripts/model_extraction_scripts/u2net_quantized/u2net_onnx_export_v2.py
```

#### FashionCLIP (Similarity Matching)

**`fashionclip_onnx_export.py`**

- Exports FashionCLIP model to ONNX format FP32

```bash
python scripts/model_extraction_scripts/fashionclip_onnx_export.py
```

**`FCLIP_quantized/FCLIP_onnx_export_V2.py`**

- Exports quantized (optimized) version of FashionCLIP FP16

```bash
python scripts/model_extraction_scripts/FCLIP_quantized/FCLIP_onnx_export_V2.py
```

**`fclip_generate_label_embeddings.py`**

- Pre-generates embeddings for common clothing labels

```bash
python scripts/model_extraction_scripts/fclip_generate_label_embeddings.py
```

#### Testing

**`test_exported_models.py`**

- Tests all exported ONNX models to ensure they work correctly

```bash
python scripts/model_extraction_scripts/test_exported_models.py
```

## Common Workflows

### Before Pushing Code

```bash
npm run ci  # Run all CI checks
```

### Reset Development Environment

```bash
./scripts/reset_docker.sh
docker compose -f docker-compose.dev.yaml up -d
```
