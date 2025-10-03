class RemoveConfidenceScoreFromClothingEmbeddings < ActiveRecord::Migration[8.0]
  def change
    remove_column :clothing_embeddings, :confidence_score, :float
  end
end
