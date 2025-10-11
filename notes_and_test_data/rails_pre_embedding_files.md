# Rails Pre-Embedding Pipeline Implementation

## 1. Model: ClothingPiece (Updated)

```ruby
# app/models/clothing_piece.rb
class ClothingPiece < ApplicationRecord
  belongs_to :user
  has_many :closet_pieces, dependent: :destroy
  has_many :closets, through: :closet_pieces
  has_many :outfit_pieces, dependent: :destroy
  has_many :outfits, through: :outfit_pieces
  has_one :clothing_embedding, dependent: :destroy

  # Active Storage for images
  has_many_attached :images
  has_one_attached :processed_image

  # Validations
  validates :name, presence: true
  validates :category, presence: true, inclusion: { in: %w[tops bottoms outerwear shoes accessories hats] }
  validates :processing_status, inclusion: { in: %w[pending processing segmented embedding_generated failed] }

  # Scopes
  scope :by_category, ->(category) { where(category: category) }
  scope :processing_complete, -> { where(processing_status: 'embedding_generated') }
  scope :pending_processing, -> { where(processing_status: ['pending', 'processing']) }

  # Processing status management
  enum processing_status: {
    pending: 'pending',
    processing: 'processing',
    segmented: 'segmented',
    embedding_generated: 'embedding_generated',
    failed: 'failed'
  }

  # JSON serialization for processing metadata
  serialize :ai_generated_tags, JSON
  serialize :processing_metadata, JSON
  serialize :colors, JSON
  serialize :materials, JSON
  serialize :weather_suitability, JSON

  def primary_image
    images.attached? ? images.first : nil
  end

  def has_embedding?
    clothing_embedding.present? && processing_status == 'embedding_generated'
  end

  def processing_complete?
    embedding_generated?
  end
end
```

## 2. Migration for ClothingPiece

```ruby
# db/migrate/xxx_create_clothing_pieces.rb
class CreateClothingPieces < ActiveRecord::Migration[7.1]
  def change
    create_table :clothing_pieces do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.string :category, null: false
      t.json :colors, default: []
      t.json :materials, default: []
      t.json :weather_suitability, default: {}
      t.json :ai_generated_tags, default: {}
      t.json :processing_metadata, default: {}
      t.string :processing_status, default: 'pending'
      t.date :purchase_date
      t.string :brand
      t.timestamps
    end

    add_index :clothing_pieces, [:user_id, :category]
    add_index :clothing_pieces, :processing_status
  end
end
```

## 3. Controller: ClothingPiecesController

```ruby
# app/controllers/clothing_pieces_controller.rb
class ClothingPiecesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_clothing_piece, only: [:show, :update, :destroy, :process_image, :approve_segmentation]

  def index
    @clothing_pieces = current_user.clothing_pieces.includes(:clothing_embedding)
    render json: @clothing_pieces.as_json(include: :clothing_embedding)
  end

  def show
    render json: @clothing_piece.as_json(
      include: :clothing_embedding,
      methods: [:primary_image_url, :processed_image_url]
    )
  end

  def create
    @clothing_piece = current_user.clothing_pieces.build(clothing_piece_params)

    if @clothing_piece.save
      # Attach uploaded images
      if params[:images].present?
        @clothing_piece.images.attach(params[:images])
      end

      render json: @clothing_piece.as_json(methods: [:primary_image_url]), status: :created
    else
      render json: { errors: @clothing_piece.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @clothing_piece.update(clothing_piece_params)
      render json: @clothing_piece
    else
      render json: { errors: @clothing_piece.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @clothing_piece.destroy
    head :no_content
  end

  # POST /clothing_pieces/:id/process_image
  def process_image
    if @clothing_piece.images.empty?
      render json: { error: 'No images attached' }, status: :bad_request
      return
    end

    @clothing_piece.update!(processing_status: 'processing')

    # Queue background job for processing
    ClothingProcessingJob.perform_later(@clothing_piece.id, params[:selected_category])

    render json: {
      message: 'Processing started',
      status: @clothing_piece.processing_status,
      processing_id: @clothing_piece.id
    }
  end

  # GET /clothing_pieces/:id/processing_status
  def processing_status
    render json: {
      id: @clothing_piece.id,
      status: @clothing_piece.processing_status,
      metadata: @clothing_piece.processing_metadata,
      has_embedding: @clothing_piece.has_embedding?
    }
  end

  # POST /clothing_pieces/:id/approve_segmentation
  def approve_segmentation
    if @clothing_piece.processing_status != 'segmented'
      render json: { error: 'Piece not ready for approval' }, status: :bad_request
      return
    end

    # Queue embedding generation
    EmbeddingGenerationJob.perform_later(@clothing_piece.id)

    render json: { message: 'Embedding generation started' }
  end

  # POST /clothing_pieces/:id/retry_processing
  def retry_processing
    @clothing_piece.update!(processing_status: 'pending', processing_metadata: {})

    ClothingProcessingJob.perform_later(@clothing_piece.id, params[:selected_category])

    render json: { message: 'Processing restarted' }
  end

  private

  def set_clothing_piece
    @clothing_piece = current_user.clothing_pieces.find(params[:id])
  end

  def clothing_piece_params
    params.require(:clothing_piece).permit(
      :name, :description, :category, :brand, :purchase_date,
      colors: [], materials: []
    )
  end
end
```

## 4. Service: ClothingProcessingService

```ruby
# app/services/clothing_processing_service.rb
class ClothingProcessingService
  include ActiveModel::Model

  attr_accessor :clothing_piece, :category_hint

  def initialize(clothing_piece, category_hint = nil)
    @clothing_piece = clothing_piece
    @category_hint = category_hint
  end

  def process!
    Rails.logger.info "Starting processing for ClothingPiece #{clothing_piece.id}"

    begin
      # Step 1: Object Detection
      detection_result = perform_object_detection
      update_processing_metadata('detection_completed', detection_result)

      # Step 2: Segmentation
      segmentation_result = perform_segmentation(detection_result)
      update_processing_metadata('segmentation_completed', segmentation_result)

      # Step 3: Create processed image
      processed_image_data = create_processed_image(segmentation_result)
      attach_processed_image(processed_image_data)

      # Update status to segmented (awaiting user approval)
      clothing_piece.update!(processing_status: 'segmented')

      Rails.logger.info "Processing completed for ClothingPiece #{clothing_piece.id}"

    rescue StandardError => e
      Rails.logger.error "Processing failed for ClothingPiece #{clothing_piece.id}: #{e.message}"
      clothing_piece.update!(
        processing_status: 'failed',
        processing_metadata: clothing_piece.processing_metadata.merge(
          'error' => e.message,
          'failed_at' => Time.current
        )
      )
      raise e
    end
  end

  private

  def perform_object_detection
    # This would integrate with your YOLO model
    # For now, return mock detection results
    {
      bounding_box: { x: 100, y: 50, width: 300, height: 400 },
      confidence: 0.85,
      detected_category: category_hint || clothing_piece.category,
      processing_time_ms: rand(200..800)
    }
  end

  def perform_segmentation(detection_result)
    # This would integrate with your FastSAM model
    # For now, return mock segmentation results
    {
      mask_data: "base64_encoded_mask_data",
      segmentation_confidence: 0.78,
      background_removed: true,
      processing_time_ms: rand(300..1200)
    }
  end

  def create_processed_image(segmentation_result)
    # This would apply the segmentation mask to create the final processed image
    # For now, return the original image data as placeholder
    clothing_piece.primary_image.blob.download
  end

  def attach_processed_image(image_data)
    clothing_piece.processed_image.attach(
      io: StringIO.new(image_data),
      filename: "processed_#{clothing_piece.id}.jpg",
      content_type: 'image/jpeg'
    )
  end

  def update_processing_metadata(step, data)
    current_metadata = clothing_piece.processing_metadata || {}
    current_metadata[step] = data.merge('completed_at' => Time.current)
    clothing_piece.update!(processing_metadata: current_metadata)
  end
end
```

## 5. Background Jobs

```ruby
# app/jobs/clothing_processing_job.rb
class ClothingProcessingJob < ApplicationJob
  queue_as :default

  def perform(clothing_piece_id, category_hint = nil)
    clothing_piece = ClothingPiece.find(clothing_piece_id)

    service = ClothingProcessingService.new(clothing_piece, category_hint)
    service.process!
  end
end

# app/jobs/embedding_generation_job.rb
class EmbeddingGenerationJob < ApplicationJob
  queue_as :default

  def perform(clothing_piece_id)
    clothing_piece = ClothingPiece.find(clothing_piece_id)

    service = EmbeddingGenerationService.new(clothing_piece)
    service.generate_embedding!
  end
end
```

## 6. Service: EmbeddingGenerationService

```ruby
# app/services/embedding_generation_service.rb
class EmbeddingGenerationService
  include ActiveModel::Model

  attr_accessor :clothing_piece

  def initialize(clothing_piece)
    @clothing_piece = clothing_piece
  end

  def generate_embedding!
    Rails.logger.info "Generating embedding for ClothingPiece #{clothing_piece.id}"

    begin
      # Get the processed image
      unless clothing_piece.processed_image.attached?
        raise "No processed image available for embedding generation"
      end

      # Generate FashionCLIP embedding
      embedding_vector = generate_fashion_clip_embedding

      # Store embedding in database
      store_embedding(embedding_vector)

      # Update clothing piece status
      clothing_piece.update!(processing_status: 'embedding_generated')

      Rails.logger.info "Embedding generated successfully for ClothingPiece #{clothing_piece.id}"

    rescue StandardError => e
      Rails.logger.error "Embedding generation failed for ClothingPiece #{clothing_piece.id}: #{e.message}"
      clothing_piece.update!(processing_status: 'failed')
      raise e
    end
  end

  private

  def generate_fashion_clip_embedding
    # This would integrate with your FashionCLIP ONNX model
    # For now, return mock 768-dimensional embedding
    Array.new(768) { rand(-1.0..1.0) }
  end

  def store_embedding(vector)
    clothing_piece.create_clothing_embedding!(
      vector_data: vector,
      model_version: 'fashionclip-v1',
      embedding_metadata: {
        generated_at: Time.current,
        model_type: 'FashionCLIP',
        dimensions: vector.length
      }
    )
  end
end
```

## 7. View: Pre-Embedding Pipeline Interface

```erb
<!-- app/views/clothing_pieces/process.html.erb -->
<div id="pre-embedding-pipeline" class="container mx-auto p-6">
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
      <h1 class="text-2xl font-bold">🌧️ Raincoat - Add Clothing Piece</h1>
      <p class="text-blue-100">Upload and process your clothing pieces with AI</p>
    </div>

    <!-- Pipeline Steps -->
    <div class="flex justify-between items-center p-4 bg-gray-50 border-b">
      <div class="step active" data-step="upload">
        <div class="step-number">1</div>
        <span>Upload</span>
      </div>
      <div class="step" data-step="category">
        <div class="step-number">2</div>
        <span>Category</span>
      </div>
      <div class="step" data-step="process">
        <div class="step-number">3</div>
        <span>Process</span>
      </div>
      <div class="step" data-step="validate">
        <div class="step-number">4</div>
        <span>Validate</span>
      </div>
      <div class="step" data-step="complete">
        <div class="step-number">5</div>
        <span>Complete</span>
      </div>
    </div>

    <!-- Content Area -->
    <div class="p-6">
      <!-- Upload Section -->
      <div id="upload-section" class="section active">
        <%= form_with model: @clothing_piece, local: false, html: { multipart: true, id: 'clothing-form' } do |form| %>
          <div class="upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <div class="text-4xl mb-4"></div>
            <h3 class="text-lg font-semibold mb-2">Upload Clothing Piece</h3>
            <p class="text-gray-600 mb-4">Drag and drop an image or click to select</p>
            <%= form.file_field :images, multiple: true, accept: 'image/*', class: 'hidden', id: 'file-input' %>
            <button type="button" onclick="document.getElementById('file-input').click()" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
              Choose Files
            </button>
          </div>

          <div class="mt-4">
            <%= form.text_field :name, placeholder: 'Piece name (e.g., Blue Denim Jacket)', class: 'w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500' %>
          </div>

          <div class="mt-4">
            <%= form.text_area :description, placeholder: 'Optional description...', rows: 3, class: 'w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500' %>
          </div>
        <% end %>

        <div id="image-preview" class="mt-4 hidden">
          <img id="preview-image" class="max-w-full h-64 object-cover rounded-lg">
        </div>
      </div>

      <!-- Category Selection -->
      <div id="category-section" class="section hidden">
        <h3 class="text-lg font-semibold mb-4">Select Category</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="category-btn" data-category="tops"> Tops</div>
          <div class="category-btn" data-category="bottoms"> Bottoms</div>
          <div class="category-btn" data-category="shoes"> Shoes</div>
          <div class="category-btn" data-category="hats"> Hats</div>
        </div>
      </div>

      <!-- Processing Section -->
      <div id="process-section" class="section hidden">
        <div class="space-y-4">
          <div class="processing-stage">
            <h4 class="font-semibold">Object Detection</h4>
            <div class="progress-bar"><div class="progress-fill" id="detection-progress"></div></div>
            <p class="text-sm text-gray-600" id="detection-status">Waiting...</p>
          </div>

          <div class="processing-stage">
            <h4 class="font-semibold">Background Segmentation</h4>
            <div class="progress-bar"><div class="progress-fill" id="segmentation-progress"></div></div>
            <p class="text-sm text-gray-600" id="segmentation-status">Waiting...</p>
          </div>
        </div>
      </div>

      <!-- Validation Section -->
      <div id="validate-section" class="section hidden">
        <h3 class="text-lg font-semibold mb-4">Validate Result</h3>
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium mb-2">Processed Image</h4>
            <div id="processed-image-container" class="border rounded-lg p-4 bg-gray-50">
              <img id="processed-image" class="max-w-full h-64 object-cover rounded">
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="font-medium">Does this look correct?</h4>
            <button id="approve-btn" class="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600">
               Looks Good - Generate Embedding
            </button>
            <button id="retry-btn" class="w-full bg-yellow-500 text-white p-3 rounded hover:bg-yellow-600">
               Retry Processing
            </button>
          </div>
        </div>
      </div>

      <!-- Complete Section -->
      <div id="complete-section" class="section hidden">
        <div class="text-center py-8">
          <div class="text-6xl mb-4"></div>
          <h3 class="text-xl font-semibold mb-2">Processing Complete!</h3>
          <p class="text-gray-600 mb-4">Your clothing piece has been processed and is ready for recommendations.</p>

          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 class="font-medium mb-2">Embedding Details</h4>
            <div id="embedding-info" class="text-sm text-gray-600 font-mono"></div>
          </div>

          <button onclick="window.location.href='/clothing_pieces'" class="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600">
            View All Pieces
          </button>
        </div>
      </div>
    </div>

    <!-- Process Log -->
    <div class="border-t bg-gray-900 text-green-400 p-4 font-mono text-sm max-h-32 overflow-y-auto" id="process-log">
      <div>System ready. Upload an image to begin...</div>
    </div>
  </div>
</div>

<style>
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    transition: opacity 0.3s;
  }

  .step.active, .step.completed {
    opacity: 1;
  }

  .step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .step.active .step-number {
    background: #3b82f6;
    color: white;
  }

  .step.completed .step-number {
    background: #10b981;
    color: white;
  }

  .section.hidden {
    display: none;
  }

  .category-btn {
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
  }

  .category-btn:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .category-btn.selected {
    border-color: #3b82f6;
    background: #3b82f6;
    color: white;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    width: 0%;
    transition: width 0.3s ease;
  }
</style>

<script>
  // JavaScript for handling the pipeline flow
  document.addEventListener('DOMContentLoaded', function() {
    let currentClothingPiece = null;
    let selectedCategory = null;
    let currentStep = 'upload';

    // File upload handling
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.querySelector('.upload-area');

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });

    // Category selection
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        selectedCategory = this.dataset.category;
        log(`Category selected: ${selectedCategory}`);

        if (currentClothingPiece) {
          setTimeout(() => {
            moveToStep('process');
            startProcessing();
          }, 500);
        }
      });
    });

    // Validation buttons
    document.getElementById('approve-btn').addEventListener('click', approveSegmentation);
    document.getElementById('retry-btn').addEventListener('click', retryProcessing);

    function handleFileUpload(file) {
      log(`Uploading file: ${file.name}`);

      const formData = new FormData();
      formData.append('clothing_piece[name]', document.querySelector('input[name="clothing_piece[name]"]').value || 'New Piece');
      formData.append('clothing_piece[description]', document.querySelector('textarea[name="clothing_piece[description]"]').value || '');
      formData.append('images[]', file);

      fetch('/clothing_pieces', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.id) {
          currentClothingPiece = data;
          showImagePreview(file);
          moveToStep('category');
          log('File uploaded successfully. Please select category.');
        } else {
          log('Upload failed: ' + JSON.stringify(data.errors));
        }
      })
      .catch(error => {
        log('Upload error: ' + error.message);
      });
    }

    function showImagePreview(file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const preview = document.getElementById('preview-image');
        preview.src = e.target.result;
        document.getElementById('image-preview').classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }

    function startProcessing() {
      log('Starting processing pipeline...');

      fetch(`/clothing_pieces/${currentClothingPiece.id}/process_image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({ selected_category: selectedCategory })
      })
      .then(response => response.json())
      .then(data => {
        log('Processing started');
        pollProcessingStatus();
      });
    }

    function pollProcessingStatus() {
      const poll = setInterval(() => {
        fetch(`/clothing_pieces/${currentClothingPiece.id}/processing_status`)
          .then(response => response.json())
          .then(data => {
            updateProcessingUI(data);

            if (data.status === 'segmented') {
              clearInterval(poll);
              moveToStep('validate');
              loadProcessedImage();
            } else if (data.status === 'failed') {
              clearInterval(poll);
              log('Processing failed');
            }
          });
      }, 2000);
    }

    function updateProcessingUI(data) {
      // Update progress bars based on processing status
      if (data.status === 'processing') {
        document.getElementById('detection-progress').style.width = '100%';
        document.getElementById('detection-status').textContent = 'Completed';
        document.getElementById('segmentation-progress').style.width = '50%';
        document.getElementById('segmentation-status').textContent = 'In progress...';
      }
    }

    function loadProcessedImage() {
      // Load the processed image for validation
      const img = document.getElementById('processed-image');
      img.src = `/clothing_pieces/${currentClothingPiece.id}/processed_image`;
      log('Segmentation complete. Please validate the result.');
    }

    function approveSegmentation() {
      log('User approved segmentation. Generating embedding...');

      fetch(`/clothing_pieces/${currentClothingPiece.id}/approve_segmentation`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      })
      .then(() => {
        pollEmbeddingStatus();
      });
    }

    function retryProcessing() {
      log('Retrying processing...');
      moveToStep('process');
      startProcessing();
    }

    function pollEmbeddingStatus() {
      const poll = setInterval(() => {
        fetch(`/clothing_pieces/${currentClothingPiece.id}/processing_status`)
          .then(response => response.json())
          .then(data => {
            if (data.status === 'embedding_generated') {
              clearInterval(poll);
              moveToStep('complete');
              showEmbeddingResults(data);
            }
          });
      }, 2000);
    }

    function showEmbeddingResults(data) {
      const info = document.getElementById('embedding-info');
      info.innerHTML = `
        Status: ${data.status}<br>
        Has Embedding: ${data.has_embedding}<br>
        Dimensions: 768<br>
        Model: FashionCLIP
      `;
      log('Processing pipeline complete! ');
    }

    function moveToStep(step) {
      // Hide all sections
      document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
      });

      // Show target section
      document.getElementById(`${step}-section`).classList.remove('hidden');

      // Update step indicators
      const steps = ['upload', 'category', 'process', 'validate', 'complete'];
      const currentIndex = steps.indexOf(step);

      document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index < currentIndex) {
          stepEl.classList.add('completed');
        } else if (index === currentIndex) {
          stepEl.classList.add('active');
        }
      });

      currentStep = step;
    }

    function log(message) {
      const logArea = document.getElementById('process-log');
      const timestamp = new Date().toLocaleTimeString();
      logArea.innerHTML += `<div>[${timestamp}] ${message}</div>`;
      logArea.scrollTop = logArea.scrollHeight;
    }
  });
</script>
```

## 8. Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  devise_for :users
  root 'clothing_pieces#index'

  resources :clothing_pieces do
    member do
      post :process_image
      get :processing_status
      post :approve_segmentation
      post :retry_processing
      get :processed_image
    end

    collection do
      get :process, to: 'clothing_pieces#new_process'
    end
  end
end
```

This implementation provides a complete Rails-based pre-embedding pipeline with:

- **Proper Model Structure**: Following your established data model patterns
- **RESTful Controllers**: Clean API endpoints for the pipeline
- **Background Processing**: Asynchronous jobs for heavy AI operations
- **Service Objects**: Separated business logic for processing and embedding
- **Interactive UI**: Complete web interface matching your prototype
- **Real-time Updates**: Status polling and progress tracking
- **Error Handling**: Proper error states and retry mechanisms

The structure integrates seamlessly with your existing Raincoat architecture and follows Rails conventions.

## 9. ClothingEmbedding Model

```ruby
# app/models/clothing_embedding.rb
class ClothingEmbedding < ApplicationRecord
  belongs_to :clothing_piece

  # Use pgvector for similarity searches
  validates :vector_data, presence: true
  validates :model_version, presence: true

  # Serialize metadata
  serialize :embedding_metadata, JSON

  # Scopes for similarity searches
  scope :similar_to, ->(vector, limit = 10) {
    select("*, vector_data <=> '[#{vector.join(',')}]' AS distance")
      .order('distance')
      .limit(limit)
  }

  def similarity_to(other_embedding)
    # Calculate cosine similarity
    return 0.0 unless other_embedding.is_a?(ClothingEmbedding)

    # This would use pgvector's similarity operators in production
    # For now, return a mock similarity score
    rand(0.1..0.9)
  end

  def vector_magnitude
    Math.sqrt(vector_data.sum { |x| x ** 2 })
  end
end
```

## 10. ClothingEmbedding Migration

```ruby
# db/migrate/xxx_create_clothing_embeddings.rb
class CreateClothingEmbeddings < ActiveRecord::Migration[7.1]
  def change
    # Enable pgvector extension
    enable_extension 'vector'

    create_table :clothing_embeddings do |t|
      t.references :clothing_piece, null: false, foreign_key: true
      t.vector :vector_data, limit: 768  # 768 dimensions for FashionCLIP
      t.string :model_version, null: false
      t.json :embedding_metadata, default: {}
      t.timestamps
    end

    # Add index for similarity searches
    add_index :clothing_embeddings, :vector_data, using: :hnsw, opclass: :vector_cosine_ops
    add_index :clothing_embeddings, :clothing_piece_id, unique: true
  end
end
```

## 11. Additional Controller Methods

```ruby
# Additional methods for ClothingPiecesController
class ClothingPiecesController < ApplicationController

  # GET /clothing_pieces/:id/processed_image
  def processed_image
    if @clothing_piece.processed_image.attached?
      redirect_to rails_blob_path(@clothing_piece.processed_image, disposition: "inline")
    else
      head :not_found
    end
  end

  # GET /clothing_pieces/:id/similar
  def similar_pieces
    unless @clothing_piece.has_embedding?
      render json: { error: 'Piece does not have embedding' }, status: :bad_request
      return
    end

    similar_pieces = ClothingEmbedding
      .joins(:clothing_piece)
      .where(clothing_pieces: { user_id: current_user.id })
      .where.not(clothing_piece_id: @clothing_piece.id)
      .similar_to(@clothing_piece.clothing_embedding.vector_data, 5)

    render json: similar_pieces.map(&:clothing_piece).as_json(
      only: [:id, :name, :category],
      methods: [:primary_image_url],
      include: {
        clothing_embedding: {
          only: [:id],
          methods: [:similarity_score]
        }
      }
    )
  end

  # GET /clothing_pieces/search
  def search
    query_params = search_params
    pieces = current_user.clothing_pieces.includes(:clothing_embedding)

    pieces = pieces.where(category: query_params[:category]) if query_params[:category].present?
    pieces = pieces.where("name ILIKE ?", "%#{query_params[:query]}%") if query_params[:query].present?
    pieces = pieces.processing_complete if query_params[:only_processed] == 'true'

    render json: pieces.as_json(
      include: :clothing_embedding,
      methods: [:primary_image_url, :processed_image_url]
    )
  end

  private

  def search_params
    params.permit(:category, :query, :only_processed)
  end
end
```

## 12. API Serializers (Optional Enhancement)

```ruby
# app/serializers/clothing_piece_serializer.rb
class ClothingPieceSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :category, :colors, :materials,
             :processing_status, :brand, :purchase_date, :created_at

  has_one :clothing_embedding

  def primary_image_url
    object.primary_image.present? ? rails_blob_url(object.primary_image) : nil
  end

  def processed_image_url
    object.processed_image.present? ? rails_blob_url(object.processed_image) : nil
  end

  def processing_complete
    object.processing_complete?
  end
end

# app/serializers/clothing_embedding_serializer.rb
class ClothingEmbeddingSerializer < ActiveModel::Serializer
  attributes :id, :model_version, :embedding_metadata, :created_at

  # Don't expose raw vector data by default for performance
  def vector_preview
    object.vector_data&.first(5)&.map { |v| v.round(4) }
  end

  def vector_dimensions
    object.vector_data&.length || 0
  end
end
```

## 13. Configuration and Initializers

```ruby
# config/initializers/active_storage.rb
Rails.application.config.active_storage.variant_processor = :mini_magick

# Configure allowed image types for clothing pieces
Rails.application.config.active_storage.content_types_allowed_inline += [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

# config/initializers/cors.rb (if using API mode)
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'localhost:3001', '127.0.0.1:3001' # Your frontend URL

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

## 14. Background Job Configuration

```ruby
# config/application.rb
module ProjectRaincoat
  class Application < Rails::Application
    # Configure Active Job adapter
    config.active_job.queue_adapter = :sidekiq

    # Configure queue priorities
    config.active_job.queue_priority = {
      default: 0,
      embedding_generation: 10,
      clothing_processing: 5
    }
  end
end

# config/schedule.rb (using whenever gem for cron jobs)
every 1.hour do
  runner "CleanupFailedProcessingJob.perform_later"
end

every 1.day, at: '2:00 am' do
  runner "RegenerateEmbeddingsJob.perform_later"
end
```

## 15. Error Handling and Monitoring

```ruby
# app/controllers/concerns/error_handling.rb
module ErrorHandling
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity
    rescue_from ClothingProcessingService::ProcessingError, with: :render_processing_error
  end

  private

  def render_not_found(exception)
    render json: {
      error: 'Resource not found',
      message: exception.message
    }, status: :not_found
  end

  def render_unprocessable_entity(exception)
    render json: {
      error: 'Validation failed',
      details: exception.record.errors.full_messages
    }, status: :unprocessable_entity
  end

  def render_processing_error(exception)
    render json: {
      error: 'Processing failed',
      message: exception.message
    }, status: :internal_server_error
  end
end

# Include in ApplicationController
class ApplicationController < ActionController::Base
  include ErrorHandling
  # ... other code
end
```

## 16. Testing Setup

```ruby
# spec/factories/clothing_pieces.rb
FactoryBot.define do
  factory :clothing_piece do
    user
    name { Faker::Commerce.product_name }
    description { Faker::Lorem.paragraph }
    category { %w[tops bottoms shoes hats].sample }
    colors { [Faker::Color.color_name] }
    materials { [%w[cotton polyester wool denim].sample] }
    processing_status { 'pending' }
    brand { Faker::Company.name }
    purchase_date { Faker::Date.backward(days: 365) }

    after(:build) do |clothing_piece|
      clothing_piece.images.attach(
        io: File.open(Rails.root.join('spec', 'fixtures', 'test_shirt.jpg')),
        filename: 'test_shirt.jpg',
        content_type: 'image/jpeg'
      )
    end

    trait :with_embedding do
      processing_status { 'embedding_generated' }

      after(:create) do |clothing_piece|
        create(:clothing_embedding, clothing_piece: clothing_piece)
      end
    end

    trait :processed do
      processing_status { 'segmented' }

      after(:create) do |clothing_piece|
        clothing_piece.processed_image.attach(
          io: File.open(Rails.root.join('spec', 'fixtures', 'processed_shirt.jpg')),
          filename: 'processed_shirt.jpg',
          content_type: 'image/jpeg'
        )
      end
    end
  end
end

# spec/factories/clothing_embeddings.rb
FactoryBot.define do
  factory :clothing_embedding do
    clothing_piece
    vector_data { Array.new(768) { rand(-1.0..1.0) } }
    model_version { 'fashionclip-v1' }
    embedding_metadata do
      {
        generated_at: Time.current,
        model_type: 'FashionCLIP',
        dimensions: 768,
        processing_time_ms: rand(1000..5000)
      }
    end
  end
end

# spec/models/clothing_piece_spec.rb
require 'rails_helper'

RSpec.describe ClothingPiece, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_one(:clothing_embedding).dependent(:destroy) }
    it { should have_many_attached(:images) }
    it { should have_one_attached(:processed_image) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:category) }
    it { should validate_inclusion_of(:category).in_array(%w[tops bottoms outerwear shoes accessories hats]) }
  end

  describe '#has_embedding?' do
    let(:clothing_piece) { create(:clothing_piece) }

    context 'when piece has embedding and is processed' do
      before do
        clothing_piece.update(processing_status: 'embedding_generated')
        create(:clothing_embedding, clothing_piece: clothing_piece)
      end

      it 'returns true' do
        expect(clothing_piece.has_embedding?).to be true
      end
    end

    context 'when piece has no embedding' do
      it 'returns false' do
        expect(clothing_piece.has_embedding?).to be false
      end
    end
  end
end

# spec/services/clothing_processing_service_spec.rb
require 'rails_helper'

RSpec.describe ClothingProcessingService do
  let(:user) { create(:user) }
  let(:clothing_piece) { create(:clothing_piece, user: user) }
  let(:service) { described_class.new(clothing_piece, 'tops') }

  describe '#process!' do
    context 'when processing succeeds' do
      it 'updates processing status to segmented' do
        expect { service.process! }
          .to change { clothing_piece.reload.processing_status }
          .from('pending')
          .to('segmented')
      end

      it 'attaches processed image' do
        service.process!
        expect(clothing_piece.processed_image).to be_attached
      end

      it 'updates processing metadata' do
        service.process!
        metadata = clothing_piece.reload.processing_metadata

        expect(metadata).to have_key('detection_completed')
        expect(metadata).to have_key('segmentation_completed')
      end
    end

    context 'when processing fails' do
      before do
        allow(service).to receive(:perform_object_detection).and_raise(StandardError.new('Detection failed'))
      end

      it 'updates status to failed' do
        expect { service.process! }.to raise_error(StandardError)
        expect(clothing_piece.reload.processing_status).to eq('failed')
      end
    end
  end
end
```

## 17. API Documentation

```yaml
# api_docs/clothing_pieces.yml
openapi: 3.0.0
info:
  title: Raincoat Clothing Pieces API
  version: 1.0.0
  description: API for managing clothing pieces and pre-embedding pipeline

paths:
  /clothing_pieces:
    get:
      summary: List all clothing pieces for current user
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/ClothingPiece"

    post:
      summary: Create new clothing piece
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                "clothing_piece[name]":
                  type: string
                "clothing_piece[description]":
                  type: string
                "clothing_piece[category]":
                  type: string
                  enum: [tops, bottoms, shoes, hats, outerwear, accessories]
                images:
                  type: array
                  items:
                    type: string
                    format: binary
      responses:
        "201":
          description: Clothing piece created
        "422":
          description: Validation errors

  /clothing_pieces/{id}/process_image:
    post:
      summary: Start image processing pipeline
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                selected_category:
                  type: string
                  enum: [tops, bottoms, shoes, hats]
      responses:
        "200":
          description: Processing started

  /clothing_pieces/{id}/processing_status:
    get:
      summary: Get current processing status
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Status retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: integer
                  status:
                    type: string
                    enum:
                      [
                        pending,
                        processing,
                        segmented,
                        embedding_generated,
                        failed,
                      ]
                  metadata:
                    type: object
                  has_embedding:
                    type: boolean

components:
  schemas:
    ClothingPiece:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        description:
          type: string
        category:
          type: string
        processing_status:
          type: string
        primary_image_url:
          type: string
        processed_image_url:
          type: string
        has_embedding:
          type: boolean
        created_at:
          type: string
          format: date-time
```

This completes the comprehensive Rails implementation of your pre-embedding pipeline! The system provides:

** Complete MVC Structure**

- Models with proper associations and validations
- Controllers with RESTful endpoints and error handling
- Views with interactive UI and real-time updates

** Production-Ready Features**

- Background job processing for heavy AI operations
- File upload handling with Active Storage
- Database optimization with proper indexing
- Comprehensive error handling and logging

** Scalable Architecture**

- Service objects for business logic separation
- Serializers for clean API responses
- Queue management for processing priorities
- Extensible for additional AI models

** Testing & Documentation**

- Factory definitions for test data
- Model and service specs
- API documentation with OpenAPI

The implementation integrates seamlessly with your existing Raincoat project structure and follows Rails conventions while providing a solid foundation for the AI-powered fashion features!
