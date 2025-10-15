class ClothingPiecesController < ApplicationController
  before_action :require_login
  before_action :set_clothing_piece, only: [:show, :similar]

  def index
    @clothing_pieces = current_user.clothing_pieces.includes(:clothing_embedding)
    @clothing_piece = ClothingPiece.new
  end
 
  def show
    @embedding = @clothing_piece.clothing_embedding
    @similar_pieces = @clothing_piece.similar_pieces if @embedding
  end

  def new
    @clothing_piece = ClothingPiece.new
  end
 
  def create
    # Extract custom parameters
    embedding_vector = params[:clothing_piece].delete(:embedding_vector)
    model_version = params[:clothing_piece].delete(:model_version)
    ai_tags_json = params[:clothing_piece][:ai_tags]
    processed_image_data = params[:processed_image_data]
    
    # Parse ai_tags if it's a JSON string
    if ai_tags_json.present?
      begin
        params[:clothing_piece][:ai_tags] = JSON.parse(ai_tags_json)
      rescue JSON::ParserError
        params[:clothing_piece][:ai_tags] = []
      end
    end
    
    @clothing_piece = current_user.clothing_pieces.build(clothing_piece_params)
    
    # Attach processed image if available
    if processed_image_data.present?
      begin
        # Remove data:image/png;base64, prefix
        image_data = processed_image_data.split(',')[1]
        decoded_image = Base64.decode64(image_data)
        
        @clothing_piece.images.attach(
          io: StringIO.new(decoded_image),
          filename: "clothing_#{Time.now.to_i}.png",
          content_type: 'image/png'
        )
      rescue => e
        Rails.logger.error "Failed to attach image: #{e.message}"
      end
    end
    
    if @clothing_piece.save
      # Handle embedding
      if embedding_vector.present?
        @clothing_piece.processing!
        
        begin
          vector = JSON.parse(embedding_vector)
          
          if @clothing_piece.create_clothing_embedding(
            vector_data: vector,
            model_version: model_version || 'fashionclip-2.0'
          )
            @clothing_piece.embedding_generated!
          else
            @clothing_piece.embedding_failed!
          end
        rescue JSON::ParserError => e
          Rails.logger.error "Failed to parse embedding: #{e.message}"
          @clothing_piece.embedding_failed!
        end
      else
        @clothing_piece.pending!
      end
      
      redirect_to clothing_pieces_path, notice: 'Clothing piece uploaded successfully!'
    else
      @clothing_pieces = current_user.clothing_pieces.includes(:clothing_embedding)
      render :new, status: :unprocessable_entity
    end
  end

  def similar
    @embedding = @clothing_piece.clothing_embedding
    @similar_pieces = @clothing_piece.similar_pieces(limit: 10)
  end
  
  
  private
 
  def set_clothing_piece
    @clothing_piece = current_user.clothing_pieces.find(params[:id])
  end
  

  def clothing_piece_params
    params.require(:clothing_piece).permit(
    :name, :description, :category, :brand,
    :purchase_date,
    images: [],
    ai_tags: [],
    user_tags: [],
    colors: [],
    materials: [],
    weather_suitability: []
    )
  end
end