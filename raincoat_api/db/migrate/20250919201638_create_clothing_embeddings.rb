# db/migrate/[timestamp]_create_clothing_embeddings.rb
class CreateClothingEmbeddings < ActiveRecord::Migration[7.0]
  def up
    # Enable pgvector extension if not already enabled
    enable_extension 'vector'
    
    create_table :clothing_embeddings do |t|
      t.references :clothing_piece, null: false, foreign_key: true, index: true
      
      t.vector :vector_data, limit: 512, null: false
      
      t.string :model_version, null: false, default: 'tinyclip-1.0'
      
      t.float :confidence_score
      
      t.json :preprocessing_metadata
      
      t.timestamps
    end
    
    add_index :clothing_embeddings, :vector_data, using: :ivfflat, opclass: :vector_cosine_ops
    
  end
  
  def down
    drop_table :clothing_embeddings
  end
end