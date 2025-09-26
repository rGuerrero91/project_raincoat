class AddProcessingStatusToClothingPieces < ActiveRecord::Migration[8.0]
  def change
    add_column :clothing_pieces, :processing_status, :integer, default: 0
    add_column :clothing_pieces, :processing_metadata, :json
    
    add_index :clothing_pieces, :processing_status
  end
end