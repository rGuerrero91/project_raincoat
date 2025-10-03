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
    embedding_vector = params[:clothing_piece].delete(:embedding_vector)
    model_version = params[:clothing_piece].delete(:model_version)

    
    @clothing_piece = current_user.clothing_pieces.build(clothing_piece_params)
    
    if @clothing_piece.save
      puts "====================== !!!!!!!!!!!!!! ===================== EMBEDDING VECTOR: #{embedding_vector}"
      # Handle embedding separately after save
      if embedding_vector
        begin
          vector = JSON.parse(embedding_vector)
          @clothing_piece.create_clothing_embedding(
            vector_data: vector,
            model_version: model_version || 'fashionclip-2.0',
            confidence_score: params[:confidence_score]&.to_f
          )
        rescue JSON::ParserError => e
          Rails.logger.error "Failed to parse embedding: #{e.message}"
        end
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
      :embedding_vector, :model_version, :purchase_date,
      :ai_tags, 
      images: [], 
      user_tags: [], 
      colors: [], 
      materials: [], 
      weather_suitability: []
    )
  end
end