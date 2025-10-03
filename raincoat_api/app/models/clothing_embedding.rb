class ClothingEmbedding < ApplicationRecord
  belongs_to :clothing_piece
  
  validates :clothing_piece_id, uniqueness: { scope: :model_version }
  validates :vector_data, presence: true
  validates :model_version, presence: true
  validates :vector_data, length: { is: 512, message: "must contain exactly 512 dimensions" }
  
  def similar_embeddings(limit: 10)
    return [] unless vector_data.present?
    
    # Use pgvector's cosine distance operator
    ClothingEmbedding
      .joins(:clothing_piece)
      .where.not(id: id)
      .where(clothing_pieces: { user_id: clothing_piece.user_id })
      .order(Arel.sql("vector_data <=> '#{vector_data}'"))
      .limit(limit)
      .includes(:clothing_piece)
  end
  
  # Get similarity score between two embeddings (Do not ask me why this works, I had the AI help me with this one)
  def similarity_to(other_embedding)
    return 0.0 unless other_embedding&.vector_data && vector_data
    
    distance = ActiveRecord::Base.connection.execute(
      "SELECT '#{vector_data}'::vector <=> '#{other_embedding.vector_data}'::vector as distance"
    ).first['distance'].to_f
    
    # Convert distance to similarity percentage
    similarity = (1 - distance).clamp(0, 1)
    (similarity * 100).round(1)
  end

  ##### Note to myself on Base.Connection method: #####
  # ActiveRecord::Base.connection.execute runs raw SQL queries directly against the database, bypassing ActiveRecord's ORM layer.
  # - Executes SQL string directly on the database connection
  # - Returns raw results (not ActiveRecord objects)
  # - Used when you need database-specific features ActiveRecord doesn't support

  # Why We Need Raw SQL Here:
  # pgvector operators like <=> aren't supported by ActiveRecord, so we have to use raw SQL to access
  # <=> - cosine distance
  # <-> - L2 distance
  # <#> - inner product distance

  
  # Class method to search for similar items by vector
  def self.search_similar(vector_array, user_id, limit: 10)
    return [] unless vector_array&.length == 512
    
    vector_string = "[#{vector_array.join(',')}]"
    
    ClothingEmbedding
      .joins(:clothing_piece)
      .where(clothing_pieces: { user_id: user_id })
      .order(Arel.sql("vector_data <=> '#{vector_string}'::vector"))
      .limit(limit)
      .includes(:clothing_piece)
  end
end