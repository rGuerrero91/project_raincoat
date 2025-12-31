class ClothingItemsController < ApplicationController
  before_action :require_login
  before_action :set_clothing_item, only: [ :show, :similar ]

  def index
    @clothing_items = current_user.clothing_items.includes(:clothing_embedding)
    @clothing_item = ClothingItem.new
  end

  def show
    @embedding = @clothing_item.clothing_embedding
    @similar_items = @clothing_item.similar_items if @embedding
  end

  def new
    @clothing_item = ClothingItem.new
  end

  def create
    # Extract custom parameters
    embedding_vector = params[:clothing_item].delete(:embedding_vector)
    model_version = params[:clothing_item].delete(:model_version)
    ai_tags_json = params[:clothing_item][:ai_tags]
    processed_image_data = params[:processed_image_data]

    # Parse ai_tags if it's a JSON string
    if ai_tags_json.present?
      begin
        params[:clothing_item][:ai_tags] = JSON.parse(ai_tags_json)
      rescue JSON::ParserError
        params[:clothing_item][:ai_tags] = []
      end
    end

    @clothing_item = current_user.clothing_items.build(clothing_item_params)

    # Attach processed image if available
    if processed_image_data.present?
      begin
        # Remove data:image/png;base64, prefix
        image_data = processed_image_data.split(',')[1]
        decoded_image = Base64.decode64(image_data)

        @clothing_item.images.attach(
          io: StringIO.new(decoded_image),
          filename: "clothing_#{Time.now.to_i}.png",
          content_type: 'image/png'
        )
      rescue => e
        Rails.logger.error "Failed to attach image: #{e.message}"
      end
    end

    if @clothing_item.save
      # handle embedding
      if embedding_vector.present?
        @clothing_item.processing!

        begin
          vector = JSON.parse(embedding_vector)

          if @clothing_item.create_clothing_embedding(
            vector_data: vector,
            model_version: model_version || 'fashionclip-2.0'
          )
            @clothing_item.embedding_generated!
          else
            @clothing_item.embedding_failed!
          end
        rescue JSON::ParserError => e
          Rails.logger.error "Failed to parse embedding: #{e.message}"
          @clothing_item.embedding_failed!
        end
      else
        @clothing_item.pending!
      end

      redirect_to clothing_items_path, notice: 'Clothing item uploaded successfully!'
    else
      @clothing_items = current_user.clothing_items.includes(:clothing_embedding)
      render :new, status: :unprocessable_entity
    end
  end

  def similar
    @embedding = @clothing_item.clothing_embedding
    @similar_items = @clothing_item.similar_items(limit: 10)
  end


  private

  def set_clothing_item
    @clothing_item = current_user.clothing_items.find(params[:id])
  end


  def clothing_item_params
    params.require(:clothing_item).permit(
    :name, :description, :category, :brand,
    :purchase_date,
    images: [],
    ai_tags: [],
    user_tags: [],
    colors: [],
    materials: [],
    weather_suitability: []
    )
  end
end
