'use client';

import { useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Tag from '@/components/Tag';
import { ClothingItem } from './page';

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
    <Container className="flex items-center justify-center min-h-screen py-8">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          How does this <strong className="text-primary">look?</strong>
        </h2>

        {/* Processed Image */}
        {(item.processedImage || item.image) && (
          <div className="mb-8 flex justify-center">
            <div className="relative w-56 h-56 rounded-3xl overflow-hidden shadow-medium bg-neutral-light">
              <img
                src={item.processedImage || item.image}
                alt="Processed item"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Subheading */}
        <p className="text-lg text-neutral-medium mb-6">Suggested tags:</p>

        {/* Tags Display */}
        <div className="flex flex-wrap gap-2 justify-center mb-8 min-h-[60px]">
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
          <div className="mb-8 p-6 bg-neutral-light rounded-2xl">
            <p className="text-base font-semibold text-ink mb-4">Add More Tags</p>

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {suggestedTags
                .filter(tag => !tags.includes(tag))
                .map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => setTags([...tags, tag])}
                    className="tag hover:bg-primary hover:text-white cursor-pointer transition-all"
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
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                placeholder="Custom tag..."
                className="flex-1 px-5 py-3 border-2 border-neutral-medium/30 rounded-full focus:border-primary focus:outline-none transition-colors"
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
              <Button variant="secondary" fullWidth onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setIsEditing(false);
                  handleNext();
                }}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" fullWidth onClick={() => setIsEditing(true)}>
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
