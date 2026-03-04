class Api::V1::ClothingItemsController < Api::V1::BaseController
  before_action :set_clothing_item, only: [ :show, :update, :destroy, :get_embedding, :save_embedding, :similar ]

  def index
    items = current_user.clothing_items.includes(:clothing_embedding)

    items = items.where(category: params[:category]) if params[:category].present?
    if params[:search].present?
      search_term = "%#{params[:search]}%"
      items = items.where("user_tags::text ILIKE ? OR ai_tags::text ILIKE ? OR name ILIKE ?",
                          search_term, search_term, search_term)
    end

    render json: {
      success: true,
      data: items.map { |item| serialize_clothing_item(item) },
      meta: {
        total: items.count,
        with_embeddings: items.select(&:clothing_embedding).count
      }
    }
  end

  def show
    render json: {
      success: true,
      data: serialize_clothing_item(@clothing_item, include_embedding: true)
    }
  end

  def create
    item = current_user.clothing_items.build(clothing_item_params)

    if item.save
      render json: {
        success: true,
        message: 'Clothing item created successfully',
        data: serialize_clothing_item(item)
      }, status: :created
    else
      render json: {
        success: false,
        error: 'Failed to create clothing item',
        details: item.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/clothing_items/:id
  def update
    if @clothing_item.update(clothing_item_params)
      render json: {
        success: true,
        message: 'Clothing item updated successfully',
        data: serialize_clothing_item(@clothing_item)
      }
    else
      render json: {
        success: false,
        error: 'Failed to update clothing item',
        details: @clothing_item.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/clothing_items/:id
  def destroy
    @clothing_item.destroy
    head :no_content
  end

  # GET /api/v1/clothing_items/:id/embedding
  def get_embedding
    unless @clothing_item.clothing_embedding
      return render_error('No embedding available for this clothing item')
    end

    render json: {
      success: true,
      data: {
        clothing_item_id: @clothing_item.id,
        embedding: {
          id: @clothing_item.clothing_embedding.id,
          vector_data: @clothing_item.clothing_embedding.vector_data,
          model_version: @clothing_item.clothing_embedding.model_version,
          preprocessing_metadata: @clothing_item.clothing_embedding.preprocessing_metadata,
          vector_dimensions: @clothing_item.clothing_embedding.vector_data&.length || 0,
          created_at: @clothing_item.clothing_embedding.created_at
        }
      }
    }
  end

  # POST /api/v1/clothing_items/:id/embedding
  def save_embedding
    vector_data = parse_vector_data(params[:vector_data])

    if vector_data.nil?
      return render_error('Invalid vector data. Must be array of 512 numbers or comma-separated string.')
    end

    embedding = @clothing_item.clothing_embedding || @clothing_item.build_clothing_embedding

    embedding.assign_attributes(
      vector_data: vector_data,
      model_version: params[:model_version] || 'fashionclip-2.0',
      preprocessing_metadata: params[:preprocessing_metadata]
    )

    if embedding.save
      render json: {
        success: true,
        message: 'Embedding saved successfully',
        data: {
          clothing_item: serialize_clothing_item(@clothing_item),
          embedding: serialize_embedding(embedding)
        }
      }
    else
      render json: {
        success: false,
        error: 'Failed to save embedding',
        details: embedding.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/clothing_items/:id/similar
  def similar
    unless @clothing_item.clothing_embedding
      return render_error('No embedding available for this clothing item')
    end

    # Parse query parameters
    limit = [ params[:limit]&.to_i || 10, 50 ].min # Max 50 results
    filters = build_similarity_filters

    similar_items = @clothing_item.similar_items(limit: limit, **filters)

    render json: {
      success: true,
      data: {
        source_item: serialize_clothing_item(@clothing_item),
        similar_items: similar_items.map do |result|
          {
            item: serialize_clothing_item(result[:item]),
            similarity_score: result[:similarity_score],
            similarity_percentage: "#{result[:similarity_score]}%",
            distance_metric: result[:distance_metric]
          }
        end
      },
      meta: {
        total_found: similar_items.length,
        search_limit: limit,
        filters_applied: filters.keys
      }
    }
  end

  private

  def set_clothing_item
    @clothing_item = current_user.clothing_items.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error('Clothing item not found', :not_found)
  end

  def clothing_item_params
    params.require(:clothing_item).permit(:name, :description, :category, :brand,
                                          colors: [], materials: [],
                                          ai_tags: [], user_tags: [])
  end

  def parse_vector_data(data)
    return nil unless data.present?

    if data.is_a?(Array)
      # Already an array
      vector = data.map(&:to_f)
    elsif data.is_a?(String)
      # Comma-separated string
      vector = data.split(',').map { |v| v.strip.to_f }
    else
      return nil
    end

    vector.length == 512 ? vector : nil
  end

  def serialize_clothing_item(item, include_embedding: false)
    data = {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      brand: item.brand,
      colors: item.colors,
      materials: item.materials,
      ai_tags: item.ai_tags,
      user_tags: item.user_tags,
      purchase_date: item.purchase_date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      has_embedding: item.clothing_embedding.present?,
      has_images: item.images.attached?
    }

    if item.images.attached?
      data[:images] = item.images.map do |image|
        {
          id: image.id,
          filename: image.filename.to_s,
          url: url_for(image),
          content_type: image.content_type
        }
      end
    end

    if include_embedding && item.clothing_embedding
      data[:embedding] = serialize_embedding(item.clothing_embedding)
    end

    data
  end

  def serialize_embedding(embedding)
    {
      id: embedding.id,
      model_version: embedding.model_version,
      preprocessing_metadata: embedding.preprocessing_metadata,
      vector_dimensions: embedding.vector_data&.length || 0,
      created_at: embedding.created_at,
      updated_at: embedding.updated_at
      # Note: We don't include the actual vector_data in API responses by default
      # for performance reasons. It can be requested separately if needed.
    }
  end

  def build_similarity_filters
    filters = {}

    # Category filter
    filters[:category] = params[:category] if params[:category].present?

    # Minimum similarity threshold (0-100)
    if params[:min_similarity].present?
      filters[:min_similarity] = params[:min_similarity].to_f.clamp(0.0, 100.0)
    end

    # Color filters (comma-separated or array)
    if params[:colors].present?
      filters[:colors] = params[:colors].is_a?(Array) ? params[:colors] : params[:colors].split(',').map(&:strip)
    end

    # Material filters (comma-separated or array)
    if params[:materials].present?
      filters[:materials] = params[:materials].is_a?(Array) ? params[:materials] : params[:materials].split(',').map(&:strip)
    end

    filters
  end
end
