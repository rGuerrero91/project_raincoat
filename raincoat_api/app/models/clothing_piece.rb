# app/models/clothing_piece.rb
class ClothingPiece < ApplicationRecord
  belongs_to :user
  has_one :clothing_embedding, dependent: :destroy
  has_many_attached :images
  
  validates :name, presence: true
  validates :category, presence: true, inclusion: { 
    in: %w[tops bottoms outerwear shoes accessories],
    message: "must be one of: tops, bottoms, outerwear, shoes, accessories"
  }
  
  # Method to find similar pieces using embeddings
  def similar_pieces(limit: 10)
    return [] unless clothing_embedding&.vector_data
    
    # Find similar items using pgvector cosine similarity
    embedding_vector = clothing_embedding.vector_data
    
    similar_embeddings = ClothingEmbedding
      .joins(:clothing_piece)
      .where.not(clothing_piece_id: id)
      .where(clothing_pieces: { user_id: user_id })
      .order(Arel.sql("vector_data <=> '#{embedding_vector}'"))
      .limit(limit)
      .includes(:clothing_piece)
    
    # Return array of [clothing_piece, similarity_score] pairs
    similar_embeddings.map do |embedding|
      similarity = calculate_similarity(embedding_vector, embedding.vector_data)
      [embedding.clothing_piece, similarity]
    end
  end
  
  private
  
  def calculate_similarity(vector1, vector2)
    # Cosine similarity calculation (pgvector <=> returns distance, so convert to similarity)
    distance = ActiveRecord::Base.connection.execute(
      "SELECT '#{vector1}' <=> '#{vector2}' as distance"
    ).first['distance'].to_f
    
    # Convert distance to similarity (1 - distance for cosine)
    [1 - distance, 0].max
  end
end