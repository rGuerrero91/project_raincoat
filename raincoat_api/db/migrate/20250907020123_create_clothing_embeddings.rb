# db/migrate/[timestamp]_create_clothing_embeddings.rb
class CreateClothingEmbeddings < ActiveRecord::Migration[7.0]
  def up
    # Enable pgvector extension if not already enabled
    enable_extension 'vector'
    
    create_table :clothing_embeddings do |t|
      t.references :clothing_piece, null: false, foreign_key: true, index: true
      
      # Vector data - TinyCLIP typically outputs 512-dimensional vectors
      t.vector :vector_data, limit: 512, null: false
      
      # Track which model version generated this embedding
      t.string :model_version, null: false, default: 'tinyclip-1.0'
      
      # Store confidence score from the embedding generation
      t.float :confidence_score
      
      # Optional: store preprocessing metadata
      t.json :preprocessing_metadata
      
      t.timestamps
    end
    
    # Add index for efficient similarity searches
    add_index :clothing_embeddings, :vector_data, using: :ivfflat, opclass: :vector_cosine_ops
    
    # Ensure one embedding per clothing piece per model version
    add_index :clothing_embeddings, [:clothing_piece_id, :model_version], unique: true
  end
  
  def down
    drop_table :clothing_embeddings
  end
end