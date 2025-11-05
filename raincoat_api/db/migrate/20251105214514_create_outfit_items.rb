class CreateOutfitItems < ActiveRecord::Migration[8.0]
  def change
    create_table :outfit_items do |t|
      t.references :outfit, null: false, foreign_key: true
      t.references :clothing_piece, null: false, foreign_key: true
      t.string :slot, null: false  # e.g., "top", "bottom", "shoes", "outerwear"
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :outfit_items, [:outfit_id, :slot], unique: true
    # Note: index on clothing_piece_id is automatically created by t.references
  end
end
