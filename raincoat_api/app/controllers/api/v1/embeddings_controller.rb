class Api::V1::EmbeddingsController < Api::V1::BaseController
  
  # POST /api/v1/embeddings/search
  def search
    vector_data = parse_vector_data(params[:vector_data])
    
    if vector_data.nil?
      return render_error('Invalid vector data. Must be array of 512 numbers or comma-separated string.')
    end
    
    limit = [params[:limit]&.to_i || 10, 50].min # Max 50 results
    category_filter = params[:category]
    
    similar_embeddings = ClothingEmbedding.search_similar(vector_data, current_user.id, limit: limit * 2)
    
    # Filter by category
    if category_filter.present?
      similar_embeddings = similar_embeddings.select do |embedding|
        embedding.clothing_item.category == category_filter
      end
    end
    
    # Limit results and calculate similarity scores
    results = similar_embeddings.first(limit).map do |embedding|
      # Calculate similarity score
      similarity = calculate_similarity_score(vector_data, embedding.vector_data)
      
      {
        item: serialize_clothing_item(embedding.clothing_item),
        embedding: serialize_embedding(embedding),
        similarity_score: similarity,
        similarity_percentage: "#{similarity}%"
      }
    end
    
    render json: {
      success: true,
      data: {
        search_results: results,
        search_metadata: {
          query_vector_dimensions: vector_data.length,
          category_filter: category_filter,
          total_found: results.length,
          search_limit: limit
        }
      }
    }
  end
  
  # GET /api/v1/embeddings/stats
  def stats
    embeddings = current_user.clothing_items.joins(:clothing_embedding)

    stats = {
      total_items: current_user.clothing_items.count,
      items_with_embeddings: embeddings.count,
      embeddings_by_category: embeddings.group('clothing_items.category').count,
      model_versions: ClothingEmbedding.joins(:clothing_item)
                                      .where(clothing_items: { user_id: current_user.id })
                                      .group(:model_version).count
    }

    render json: {
      success: true,
      data: stats
    }
  end
  
  private
  
  def parse_vector_data(data)
    return nil unless data.present?
    
    if data.is_a?(Array)
      vector = data.map(&:to_f)
    elsif data.is_a?(String)
      vector = data.split(',').map { |v| v.strip.to_f }
    else
      return nil
    end
    
    vector.length == 512 ? vector : nil
  end
  
  def calculate_similarity_score(vector1, vector2)
    return 0.0 unless vector1.length == vector2.length
    
    # cosine similarity calculation, do not ask me how it works right now, Claude gave me this one.
    dot_product = vector1.zip(vector2).map { |a, b| a * b }.sum
    magnitude1 = Math.sqrt(vector1.map { |v| v * v }.sum)
    magnitude2 = Math.sqrt(vector2.map { |v| v * v }.sum)
    
    return 0.0 if magnitude1 == 0 || magnitude2 == 0
    
    similarity = dot_product / (magnitude1 * magnitude2)
    (similarity * 100).round(1)
  end
  
  def serialize_clothing_item(item)
    {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      brand: item.brand,
      colors: item.colors,
      materials: item.materials,
      ai_tags: item.ai_tags,
      user_tags: item.user_tags,
      has_embedding: item.clothing_embedding.present?,
      has_images: item.images.attached?
    }
  end
  
  def serialize_embedding(embedding)
    {
      id: embedding.id,
      model_version: embedding.model_version,
      preprocessing_metadata: embedding.preprocessing_metadata,
      vector_dimensions: embedding.vector_data&.length || 0,
      created_at: embedding.created_at
    }
  end
end