# app/models/clothing_embedding.rb
class ClothingEmbedding < ApplicationRecord
  belongs_to :clothing_piece
  
  validates :clothing_piece_id, uniqueness: { scope: :model_version }
  validates :vector_data, presence: true
  validates :model_version, presence: true
  
end