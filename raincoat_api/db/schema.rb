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

ActiveRecord::Schema[8.0].define(version: 2025_09_19_201638) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vector"

  create_table "clothing_embeddings", force: :cascade do |t|
    t.bigint "clothing_piece_id", null: false
    t.vector "vector_data", limit: 512, null: false
    t.string "model_version", default: "tinyclip-1.0", null: false
    t.float "confidence_score"
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
    t.index ["user_id"], name: "index_clothing_pieces_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email"
    t.string "name"
    t.json "style_preferences"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "clothing_embeddings", "clothing_pieces"
  add_foreign_key "clothing_pieces", "users"
end
