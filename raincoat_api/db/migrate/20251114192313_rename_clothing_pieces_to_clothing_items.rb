class RenameClothingPiecesToClothingItems < ActiveRecord::Migration[8.0]
  def change
    # Rename the table
    rename_table :clothing_pieces, :clothing_items

    # Rename foreign key columns that reference clothing_items
    rename_column :clothing_embeddings, :clothing_piece_id, :clothing_item_id
    rename_column :outfit_items, :clothing_piece_id, :clothing_item_id
  end
end
