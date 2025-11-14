API Endpoints Summary
Clothing Items API

GET /api/v1/clothing_items - List all user's clothing with embedding status
GET /api/v1/clothing_items/:id - Get specific item with embedding details
POST /api/v1/clothing_items - Create new clothing item
POST /api/v1/clothing_items/:id/embedding - Store embedding vector
GET /api/v1/clothing_items/:id/similar - Find similar items

Embeddings API

POST /api/v1/embeddings/search - Search by vector (no specific item needed)
GET /api/v1/embeddings/stats - Get embedding statistics and analytics