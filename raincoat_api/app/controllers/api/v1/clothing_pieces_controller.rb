class Api::V1::ClothingPiecesController < Api::V1::BaseController
  before_action :set_clothing_piece, only: [:show, :embedding, :similar]
  
  def index
    pieces = current_user.clothing_pieces.includes(:clothing_embedding)
    
    render json: {
      success: true,
      data: pieces.map { |piece| serialize_clothing_piece(piece) },
      meta: {
        total: pieces.count,
        with_embeddings: pieces.select(&:clothing_embedding).count
      }
    }
  end
  
  def show
    render json: {
      success: true,
      data: serialize_clothing_piece(@clothing_piece, include_embedding: true)
    }
  end
  
  def create
    piece = current_user.clothing_pieces.build(clothing_piece_params)
    
    if piece.save
      render json: {
        success: true,
        message: 'Clothing piece created successfully',
        data: serialize_clothing_piece(piece)
      }, status: :created
    else
      render json: {
        success: false,
        error: 'Failed to create clothing piece',
        details: piece.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
  
  # POST /api/v1/clothing_pieces/:id/embedding
  def embedding
    vector_data = parse_vector_data(params[:vector_data])
    
    if vector_data.nil?
      return render_error('Invalid vector data. Must be array of 512 numbers or comma-separated string.')
    end
    
    # Create or update embedding
    embedding = @clothing_piece.clothing_embedding || @clothing_piece.build_clothing_embedding
    
    embedding.assign_attributes(
      vector_data: vector_data,
      model_version: params[:model_version] || 'clip-vit-base-patch32',
      confidence_score: params[:confidence_score]&.to_f,
      preprocessing_metadata: params[:preprocessing_metadata]
    )
    
    if embedding.save
      render json: {
        success: true,
        message: 'Embedding saved successfully',
        data: {
          clothing_piece: serialize_clothing_piece(@clothing_piece),
          embedding: serialize_embedding(embedding)
        }
      }
    else
      render json: {
        success: false,
        error: 'Failed to save embedding',
        details: embedding.errors.full_messages
      }, status: :unprocessable_entity
    end
  end
  
  # GET /api/v1/clothing_pieces/:id/similar
  def similar
    unless @clothing_piece.clothing_embedding
      return render_error('No embedding available for this clothing piece')
    end
    
    limit = [params[:limit]&.to_i || 10, 50].min # Max 50 results
    similar_pieces = @clothing_piece.similar_pieces(limit: limit)
    
    render json: {
      success: true,
      data: {
        source_piece: serialize_clothing_piece(@clothing_piece),
        similar_pieces: similar_pieces.map do |piece, similarity|
          {
            piece: serialize_clothing_piece(piece),
            similarity_score: similarity,
            similarity_percentage: "#{similarity}%"
          }
        end
      },
      meta: {
        total_found: similar_pieces.length,
        search_limit: limit
      }
    }
  end
  
  private
  
  def set_clothing_piece
    @clothing_piece = current_user.clothing_pieces.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Clothing piece not found', :not_found)
  end
  
  def clothing_piece_params
    params.require(:clothing_piece).permit(:name, :description, :category, :brand, 
                                          colors: [], materials: [], 
                                          ai_tags: {}, user_tags: {})
  end
  
  def parse_vector_data(data)
    return nil unless data.present?
    
    if data.is_a?(Array)
      # Already an array
      vector = data.map(&:to_f)
    elsif data.is_a?(String)
      # Comma-separated string
      vector = data.split(',').map { |v| v.strip.to_f }
    else
      return nil
    end
    
    vector.length == 512 ? vector : nil
  end
  
  def serialize_clothing_piece(piece, include_embedding: false)
    data = {
      id: piece.id,
      name: piece.name,
      description: piece.description,
      category: piece.category,
      brand: piece.brand,
      colors: piece.colors,
      materials: piece.materials,
      ai_tags: piece.ai_tags,
      user_tags: piece.user_tags,
      purchase_date: piece.purchase_date,
      created_at: piece.created_at,
      updated_at: piece.updated_at,
      has_embedding: piece.clothing_embedding.present?,
      has_images: piece.images.attached?
    }
    
    if piece.images.attached?
      data[:images] = piece.images.map do |image|
        {
          id: image.id,
          filename: image.filename.to_s,
          url: url_for(image),
          content_type: image.content_type
        }
      end
    end
    
    if include_embedding && piece.clothing_embedding
      data[:embedding] = serialize_embedding(piece.clothing_embedding)
    end
    
    data
  end
  
  def serialize_embedding(embedding)
    {
      id: embedding.id,
      model_version: embedding.model_version,
      confidence_score: embedding.confidence_score,
      preprocessing_metadata: embedding.preprocessing_metadata,
      vector_dimensions: embedding.vector_data&.length || 0,
      created_at: embedding.created_at,
      updated_at: embedding.updated_at
      # Note: We don't include the actual vector_data in API responses by default
      # for performance reasons. It can be requested separately if needed.
    }
  end
end