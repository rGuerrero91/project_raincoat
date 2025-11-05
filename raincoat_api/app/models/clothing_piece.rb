class ClothingPiece < ApplicationRecord
  belongs_to :user
  has_one :clothing_embedding, dependent: :destroy
  has_many_attached :images
  has_many :outfit_items, dependent: :destroy
  has_many :outfits, through: :outfit_items

  validates :category, presence: true, inclusion: {
    in: %w[tops bottoms outerwear shoes accessories],
    message: "must be one of: tops, bottoms, outerwear, shoes, accessories"
  }
  # Images are optional to allow demo/API creation without file uploads
  # validates :images, presence: true
 
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

  def image_url
    images.first&.url
  end

end