# app/models/clothing_piece.rb
class ClothingPiece < ApplicationRecord
  belongs_to :user
  has_one :clothing_embedding, dependent: :destroy
  has_many_attached :images 
  
  # serialize :ai_tags, coder: JSON
  
  validates :name, presence: true
  validates :category, presence: true, inclusion: { 
    in: %w[tops bottoms outerwear shoes accessories],
    message: "must be one of: tops, bottoms, outerwear, shoes, accessories"
  }
   
  validate :embedding_vector_format, if: -> { embedding_vector.present? }
  
  enum :processing_status, [
    :pending,
    :processing,
    :segmented,
    :embedding_generated,
    :embedding_failed,
    :failed
  ]
  
  def similar_pieces(limit: 10)
    return [] unless clothing_embedding&.vector_data
    
    similar_embeddings = clothing_embedding.similar_embeddings(limit: limit)
    
    similar_embeddings.map do |embedding|
      similarity_score = clothing_embedding.similarity_to(embedding)
      [embedding.clothing_piece, similarity_score]
    end
  end
  
  def has_embedding?
    clothing_embedding.present?
  end

  def embedding_vector_format
    vector = JSON.parse(embedding_vector)
    errors.add(:embedding_vector, "must be 512 dimensions") unless vector.length == 512
  rescue JSON::ParserError
    errors.add(:embedding_vector, "must be valid JSON")
  end

  def embedding_confidence
    clothing_embedding&.confidence_score
  end
end