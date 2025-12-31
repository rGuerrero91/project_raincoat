class ClothingEmbedding < ApplicationRecord
  belongs_to :clothing_item

  validates :clothing_item_id, uniqueness: { scope: :model_version }
  validates :vector_data, presence: true
  validates :model_version, presence: true
  # Note: vector_data validation is handled by the database schema (limit: 512)

  def similar_embeddings(limit: 10, category: nil, min_similarity: 0.0, colors: nil, materials: nil)
    return [] unless vector_data.present?

    # Base query with pgvector's cosine distance operator
    query = ClothingEmbedding
      .joins(:clothing_item)
      .where.not(id: id)
      .where(clothing_items: { user_id: clothing_item.user_id })

    # Filter by category if specified
    query = query.where(clothing_items: { category: category }) if category.present?

    # Filter by colors (JSON array contains any of the specified colors)
    if colors.present?
      color_conditions = colors.map { |color| 'clothing_items.colors @> ?::jsonb' }
      query = query.where(color_conditions.join(' OR '), *colors.map { |c| [ c ].to_json })
    end

    # Filter by materials (JSON array contains any of the specified materials)
    if materials.present?
      material_conditions = materials.map { |material| 'clothing_items.materials @> ?::jsonb' }
      query = query.where(material_conditions.join(' OR '), *materials.map { |m| [ m ].to_json })
    end

    # Order by similarity and apply limit
    # Use parameterized query to prevent SQL injection
    sanitized_vector = ActiveRecord::Base.connection.quote(vector_data)
    results = query
      .order(Arel.sql("vector_data <=> #{sanitized_vector}::vector"))
      .limit(limit * 2)  # Fetch more for filtering
      .includes(:clothing_item)

    # Filter by minimum similarity threshold if specified
    if min_similarity > 0.0
      results = results.select do |embedding|
        similarity = similarity_to(embedding)
        similarity >= min_similarity
      end.first(limit)
    else
      results = results.first(limit)
    end

    results
  end

  # Get similarity score between two embeddings (Do not ask me why this works, I had the AI help me with this one)
  def similarity_to(other_embedding)
    return 0.0 unless other_embedding&.vector_data && vector_data

    sql = 'SELECT ?::vector <=> ?::vector as distance'
    sanitized_sql = ActiveRecord::Base.sanitize_sql_array([ sql, vector_data, other_embedding.vector_data ])

    distance = ActiveRecord::Base.connection.execute(sanitized_sql).first['distance'].to_f

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

    sanitized_vector = ActiveRecord::Base.connection.quote(vector_string)

    ClothingEmbedding
      .joins(:clothing_item)
      .where(clothing_items: { user_id: user_id })
      .order(Arel.sql("vector_data <=> #{sanitized_vector}::vector"))
      .limit(limit)
      .includes(:clothing_item)
  end
end
