# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_11_05_214514) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vector"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "clothing_embeddings", force: :cascade do |t|
    t.bigint "clothing_piece_id", null: false
    t.vector "vector_data", limit: 512, null: false
    t.string "model_version", default: "tinyclip-1.0", null: false
    t.json "preprocessing_metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["clothing_piece_id"], name: "index_clothing_embeddings_on_clothing_piece_id"
    t.index ["vector_data"], name: "index_clothing_embeddings_on_vector_data", opclass: :vector_cosine_ops, using: :ivfflat
  end

  create_table "clothing_pieces", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name"
    t.text "description"
    t.string "category"
    t.json "colors"
    t.json "materials"
    t.json "weather_suitability"
    t.json "ai_tags"
    t.json "user_tags"
    t.date "purchase_date"
    t.string "brand"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "processing_status", default: 0
    t.json "processing_metadata"
    t.index ["processing_status"], name: "index_clothing_pieces_on_processing_status"
    t.index ["user_id"], name: "index_clothing_pieces_on_user_id"
  end

  create_table "locations", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "city", null: false
    t.string "state"
    t.string "country", null: false
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.string "timezone"
    t.boolean "is_default", default: false
    t.json "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["latitude", "longitude"], name: "index_locations_on_latitude_and_longitude"
    t.index ["user_id", "is_default"], name: "index_locations_on_user_id_and_is_default"
    t.index ["user_id"], name: "index_locations_on_user_id"
  end

  create_table "outfit_items", force: :cascade do |t|
    t.bigint "outfit_id", null: false
    t.bigint "clothing_piece_id", null: false
    t.string "slot", null: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["clothing_piece_id"], name: "index_outfit_items_on_clothing_piece_id"
    t.index ["outfit_id", "slot"], name: "index_outfit_items_on_outfit_id_and_slot", unique: true
    t.index ["outfit_id"], name: "index_outfit_items_on_outfit_id"
  end

  create_table "outfits", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.decimal "weather_temperature", precision: 4, scale: 1
    t.string "weather_condition"
    t.string "season"
    t.text "description"
    t.json "style_tags", default: []
    t.json "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "created_at"], name: "index_outfits_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_outfits_on_user_id"
    t.index ["weather_condition"], name: "index_outfits_on_weather_condition"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "name"
    t.json "style_preferences"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "weather_snapshots", force: :cascade do |t|
    t.bigint "location_id", null: false
    t.decimal "temperature_c", precision: 4, scale: 1, null: false
    t.decimal "temperature_f", precision: 4, scale: 1
    t.decimal "feels_like_c", precision: 4, scale: 1
    t.decimal "feels_like_f", precision: 4, scale: 1
    t.string "condition_text", null: false
    t.string "condition_code"
    t.string "condition_icon_url"
    t.integer "humidity"
    t.decimal "wind_kph", precision: 5, scale: 2
    t.decimal "wind_mph", precision: 5, scale: 2
    t.string "wind_direction"
    t.decimal "precipitation_mm", precision: 5, scale: 2
    t.decimal "uv_index", precision: 3, scale: 1
    t.integer "cloud_coverage"
    t.datetime "recorded_at", null: false
    t.datetime "fetched_at"
    t.json "raw_response"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["condition_text"], name: "index_weather_snapshots_on_condition_text"
    t.index ["location_id", "recorded_at"], name: "index_weather_snapshots_on_location_id_and_recorded_at"
    t.index ["location_id"], name: "index_weather_snapshots_on_location_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "clothing_embeddings", "clothing_pieces"
  add_foreign_key "clothing_pieces", "users"
  add_foreign_key "locations", "users"
  add_foreign_key "outfit_items", "clothing_pieces"
  add_foreign_key "outfit_items", "outfits"
  add_foreign_key "outfits", "users"
  add_foreign_key "weather_snapshots", "locations"
end
