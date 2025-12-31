class CreateLocations < ActiveRecord::Migration[8.0]
  def change
    create_table :locations do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :city, null: false
      t.string :state
      t.string :country, null: false
      t.decimal :latitude, precision: 10, scale: 6, null: false
      t.decimal :longitude, precision: 10, scale: 6, null: false
      t.string :timezone
      t.boolean :is_default, default: false
      t.json :metadata

      t.timestamps
    end

    add_index :locations, [ :user_id, :is_default ]
    add_index :locations, [ :latitude, :longitude ]
  end
end
