# Raincoat Pre-Embedding Pipeline - Detailed Overview

## **Pipeline Purpose**
Transform raw clothing images uploaded by users into clean, AI-ready embeddings that enable accurate outfit recommendations, wardrobe management, and fashion similarity searches.

---

## **Complete Pipeline Flow**

```
Image Upload → Category Selection → Object Detection → Segmentation → 
User Validation → FashionCLIP Embedding → Storage → Complete
```

---

## **Step-by-Step User Experience**

### **Step 1: Image Upload & Basic Info**
- **User Action**: Drags/drops clothing image or clicks to upload
- **System**: Validates file type, size, and creates ClothingPiece record
- **UI Feedback**: Image preview, file validation messages
- **Data Stored**: Original image via Active Storage, basic metadata

### **Step 2: Category Selection** 
- **User Action**: Selects primary category (tops, bottoms, shoes, hats)
- **System**: Updates ClothingPiece.category, prepares detection constraints
- **UI Feedback**: Category buttons with visual selection
- **Purpose**: Improves AI detection accuracy by narrowing search scope

### **Step 3: Automated Processing (Background)**
- **User Action**: Waits while seeing progress indicators
- **System**: Runs object detection → segmentation → creates processed image
- **UI Feedback**: Real-time progress bars, processing status updates
- **Duration**: 2-5 seconds depending on image complexity

### **Step 4: User Validation**
- **User Action**: Reviews segmented clothing item, approves or retries
- **System**: Displays side-by-side comparison of original vs processed
- **UI Feedback**: Processed image preview with approve/retry/adjust controls
- **Quality Gate**: Ensures clean data before embedding generation

### **Step 5: Embedding Generation (Background)**
- **User Action**: Waits while FashionCLIP processes approved image
- **System**: Generates 512-dimensional embedding vector
- **UI Feedback**: Embedding generation progress, completion confirmation
- **Duration**: 1-3 seconds for FashionCLIP inference

### **Step 6: Pipeline Complete**
- **User Action**: Views completion summary, continues to wardrobe management
- **System**: ClothingPiece marked as 'embedding_generated'
- **UI Feedback**: Success message, embedding statistics, next action options
- **Result**: Clothing item ready for AI-powered recommendations

---

## **Technical Architecture**

### **Frontend Components (Rails + JavaScript)**

#### **Upload Interface**
```erb
<!-- clothing_pieces/process.html.erb -->
- Drag & drop upload area
- File validation and preview  
- Progress step indicators
- Real-time status polling
```

#### **Processing UI**
```javascript
// Real-time pipeline JavaScript
- AJAX status polling every 2 seconds
- Progress bar animations
- Step-by-step navigation
- Error handling and retry mechanisms
```

### **Backend Components (Rails API)**

#### **Models**
```ruby
# ClothingPiece Model
- Attributes: name, description, category, colors, materials
- Status: processing_status enum (pending → processing → segmented → embedding_generated)
- Storage: has_many_attached :images, has_one_attached :processed_image
- Metadata: processing_metadata JSON field for pipeline tracking

# ClothingEmbedding Model  
- Vector storage: pgvector field (512 dimensions)
- Relationships: belongs_to :clothing_piece
- Similarity: built-in vector similarity operations
```

#### **Controllers**
```ruby
# ClothingPiecesController API Endpoints
POST /clothing_pieces                    # Create with image upload
POST /clothing_pieces/:id/process_image  # Start pipeline processing
GET  /clothing_pieces/:id/processing_status  # Poll status updates  
POST /clothing_pieces/:id/approve_segmentation  # User approves result
POST /clothing_pieces/:id/retry_processing  # Retry failed processing
GET  /clothing_pieces/:id/processed_image  # Serve processed image
```

#### **Service Objects**
```ruby
# ClothingProcessingService
- Coordinates object detection and segmentation
- Updates processing metadata and status
- Handles errors and retries
- Creates processed image with background removal

# EmbeddingGenerationService  
- Loads FashionCLIP ONNX model
- Preprocesses segmented image for embedding
- Generates 512D embedding vector
- Stores embedding in ClothingEmbedding model
```

#### **Background Jobs**
```ruby
# ClothingProcessingJob (Sidekiq/ActiveJob)
- Runs object detection and segmentation asynchronously
- Updates ClothingPiece.processing_status throughout pipeline
- Handles processing failures with exponential backoff

# EmbeddingGenerationJob
- Generates FashionCLIP embeddings after user approval
- Stores final embedding vector in database
- Marks ClothingPiece as 'embedding_generated'
```

---

## **AI Model Integration**

### **Object Detection: YOLO (You Only Look Once)**
```
Purpose: Locate clothing item within uploaded image
Input: Raw uploaded image (any resolution)
Output: Bounding box coordinates + confidence score
Model Size: ~6-12MB (YOLOv8 Nano)
Inference Time: ~100-300ms on CPU
Integration: ONNX model loaded in ClothingProcessingService
```

### **Segmentation: FastSAM (Segment Anything Mobile)**  
```
Purpose: Remove background, isolate clothing item
Input: Cropped image from detection step
Output: Binary mask for precise clothing boundaries
Model Size: ~40MB ONNX format
Inference Time: ~200-500ms on CPU  
Integration: Applied after detection in processing service
```

### **Embedding: FashionCLIP**
```
Purpose: Generate semantic embedding for clothing similarity
Input: Segmented clothing image (224x224 normalized)
Output: 512-dimensional embedding vector
Model Size: ~334MB ONNX format
Inference Time: ~1-3 seconds on CPU
Integration: EmbeddingGenerationService after user approval
```

---

## **Data Storage Strategy**

### **Image Storage (Active Storage)**
```
Original Images: not stored
Processed Images: Background removed, cropped, normalized, stored on device
Thumbnails: Generated variants for UI display (150x150, 300x300)
Storage Backend: Local filesystem
```

### **Embedding Storage (PostgreSQL + pgvector)**
```sql
-- ClothingEmbeddings Table Structure
CREATE TABLE clothing_embeddings (
  id SERIAL PRIMARY KEY,
  clothing_piece_id INTEGER REFERENCES clothing_pieces(id),
  vector_data VECTOR(512),  -- FashionCLIP embedding
  model_version VARCHAR NOT NULL,
  embedding_metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Similarity Search Index  
CREATE INDEX ON clothing_embeddings 
USING hnsw (vector_data vector_cosine_ops);
```

### **Metadata Tracking**
```json
// ClothingPiece.processing_metadata example
{
  "detection_completed": {
    "bounding_box": {"x": 100, "y": 50, "width": 300, "height": 400},
    "confidence": 0.85,
    "processing_time_ms": 245,
    "completed_at": "2024-01-15T10:30:45Z"
  },
  "segmentation_completed": {
    "segmentation_confidence": 0.78,
    "background_removed": true,
    "processing_time_ms": 412,
    "completed_at": "2024-01-15T10:30:47Z"  
  },
  "user_approved": {
    "approved_at": "2024-01-15T10:31:15Z",
    "user_id": 123
  }
}
```

---

## **Performance Characteristics**

### **Processing Speed**
```
Total Pipeline Time: 3-8 seconds per image
- Upload validation: <100ms
- Object detection: 100-300ms  
- Segmentation: 200-500ms
- User validation: Variable (human-in-loop)
- Embedding generation: 1-3 seconds
- Database storage: <100ms
```

### **Resource Usage**
```
CPU: Moderate during AI inference (spikes to 60-80%)
Memory: ~2GB peak during FashionCLIP inference
Disk: ~5-10MB per clothing item (images + embedding)
Network: Minimal (all processing local)
```

### **Scalability Considerations** 
```
Concurrent Processing: Limited by CPU cores (recommend 2-4 concurrent jobs)
Queue Management: Sidekiq with Redis for job queuing
Model Caching: ONNX models loaded once, cached in memory
Database: pgvector indexes scale to millions of embeddings
```

---

## **Error Handling & Recovery**

### **Processing Failures**
- **Detection Failure**: Retry with relaxed confidence threshold
- **Segmentation Failure**: Fallback to manual crop tools  
- **Embedding Failure**: Log error, allow manual retry
- **Model Loading Failure**: Graceful degradation with user notification

### **User Experience During Errors**
- **Clear Error Messages**: "Processing failed, would you like to retry?"
- **Retry Mechanisms**: One-click retry for failed steps
- **Manual Overrides**: Fallback to manual crop if AI fails
- **Status Persistence**: Processing state saved across page refreshes

### **Data Integrity**
- **Atomic Operations**: Database transactions for critical updates
- **Cleanup Jobs**: Remove orphaned files and failed processing attempts  
- **Backup Strategy**: Regular backups of embeddings and processed images
- **Audit Trails**: Complete processing history in metadata

---

## **Success Metrics & Validation**

### **Technical Metrics**
- **Processing Success Rate**: Target >95% of uploads complete successfully
- **Average Processing Time**: Target <5 seconds end-to-end
- **Embedding Quality**: Similarity search accuracy >80%
- **User Approval Rate**: Target >90% of segmentations approved

### **Business Metrics**  
- **User Engagement**: Time spent in wardrobe management after upload
- **Feature Adoption**: Percentage of users completing full pipeline
- **Recommendation Accuracy**: Click-through rate on AI suggestions
- **Retention Impact**: User retention after successful clothing uploads

---

## **Future Enhancements**

### **Short-term (Next 6 months)**
- **Batch Processing**: Upload multiple items simultaneously
- **Auto-tagging**: Automatic material, color, and style detection
- **Mobile Optimization**: Progressive Web App for mobile uploads

### **Long-term (6+ months)**  
- **Advanced Segmentation**: Handle complex backgrounds and multiple items
- **Style Transfer**: Generate outfit variations and styling suggestions  
- **3D Understanding**: Pose estimation and fit prediction
- **Multimodal Embeddings**: Combine image + text descriptions for richer representations

---

This pipeline forms the foundation for all AI-powered features in Raincoat, enabling intelligent outfit recommendations, wardrobe analysis, and personalized fashion insights.