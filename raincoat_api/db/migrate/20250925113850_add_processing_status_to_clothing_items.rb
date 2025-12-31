class AddProcessingStatusToClothingItems < ActiveRecord::Migration[8.0]
  def change
    add_column :clothing_items, :processing_status, :integer, default: 0
    add_column :clothing_items, :processing_metadata, :json

    add_index :clothing_items, :processing_status
  end
end
