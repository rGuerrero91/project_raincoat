# SERVER SETUP (One-Time)

Fashion Labels → Text Encoder → Label Embeddings (512D) → PostgreSQL/pgvector
→ Export to JSON

TRANSITIONAL_LABELS (Rule-Based Dict) → Store as JSON → Serve to client

# CLIENT-SIDE PIPELINE

User Upload Photo
↓
U2-Net ONNX (background removal)
↓
Preprocess (224x224, normalize)
↓
FashionCLIP Vision ONNX
↓
Image Embedding (512D)
↓
Compare with Label Embeddings (from CDN)
↓
Cosine Similarity → Top 3-5 Tags
↓
User Validates/Edits
↓
Send to Server: [embedding + tags]

# CDN ASSETS

- u2net.onnx (~167 MB)
- fashionclip_vision.onnx (~150 MB)
- label_embeddings.json (~few KB)

# SERVER STORAGE

Rails API receives:

- Image embedding (512D array)
- User-validated tags
- Metadata

Stores in PostgreSQL

# OUTFIT RECOMMENDATION FLOW

Weather API Response ("heavy rain")
↓
Generate embedding OR lookup cached
↓
Cosine similarity vs Fashion Labels → AI suggestions
↓
Apply TRANSITIONAL_LABELS rules (if exist) → Boost/filter/prioritize
↓
Final weather-appropriate suggestions
↓
Match against user's wardrobe embeddings
↓
Recommended outfits
