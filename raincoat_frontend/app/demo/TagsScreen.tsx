'use client';

import { useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Tag from '@/components/Tag';
import { ClothingItem } from '../page';

interface TagsScreenProps {
  item: ClothingItem;
  onNext: (tags: string[]) => void;
}

export default function TagsScreen({ item, onNext }: TagsScreenProps) {
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleNext = () => {
    onNext(tags);
  };

  const suggestedTags = ['formal', 'spring', 'breathable', 'warm'];

  return (
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Headline */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-3">
          How does this look?
        </h2>

        {/* Processed Image */}
        {item.image && (
          <div className="mb-6 flex justify-center">
            <div className="relative w-48 h-48 rounded-lg overflow-hidden shadow-lg bg-neutral-light">
              <img
                src={item.image}
                alt="Processed item"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Subheading */}
        <p className="text-lg text-neutral-medium mb-4">Suggested tags:</p>

        {/* Tags Display */}
        <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[60px]">
          {tags.map((tag, index) => (
            <Tag
              key={index}
              label={tag}
              removable={isEditing}
              onRemove={() => handleRemoveTag(index)}
            />
          ))}
        </div>

        {/* Edit Mode */}
        {isEditing && (
          <div className="mb-6 p-4 bg-neutral-light rounded-lg">
            <p className="text-sm font-semibold text-neutral-dark mb-3">
              Add More Tags
            </p>

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedTags
                .filter((tag) => !tags.includes(tag))
                .map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => setTags([...tags, tag])}
                    className="tag hover:bg-accent-info hover:text-white cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Custom tag..."
                className="flex-1 px-4 py-2 border-2 border-neutral-medium/30 rounded-lg focus:border-accent-info focus:outline-none"
              />
              <Button variant="secondary" onClick={handleAddTag}>
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setIsEditing(false)}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setIsEditing(true)}
              >
                Edit Tags
              </Button>
              <Button variant="primary" fullWidth onClick={handleNext}>
                Looks Good
              </Button>
            </>
          )}
        </div>
      </Card>
    </Container>
  );
}
