import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { X } from 'lucide-react';
import { useState } from 'react';
import type { ClothingItem } from '../App';

interface EditTagSheetProps {
  item: ClothingItem | null;
  onClose: () => void;
  onSave: (tags: string[]) => void;
}

export default function EditTagSheet({ item, onClose, onSave }: EditTagSheetProps) {
  const [tags, setTags] = useState([
    'red dress',
    'casual',
    'summer',
    'cotton',
    'sleeveless'
  ]);
  const [customTag, setCustomTag] = useState('');

  const suggestedTags = ['formal', 'elegant', 'lightweight', 'breathable', 'midi'];

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-end justify-end p-0 bg-black/50">
      <div className="w-full bg-white rounded-t-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-[#212121]">Edit Tags</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-[#757575]" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-[#757575]">Current Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge 
                key={tag}
                variant="secondary"
                className="gap-2 pr-2 bg-[#e3f2fd] text-[#1976d2]"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:bg-white/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[#757575]">Add More</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <Badge 
                key={tag}
                variant="outline"
                onClick={() => addSuggestedTag(tag)}
                className={`cursor-pointer ${
                  tags.includes(tag) 
                    ? 'opacity-40 cursor-not-allowed' 
                    : 'hover:bg-[#e3f2fd] hover:text-[#1976d2] hover:border-[#1976d2]'
                }`}
              >
                + {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[#757575]">Custom Tag</p>
          <div className="flex gap-2">
            <Input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="Enter custom tag"
              onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
              className="flex-1"
            />
            <Button onClick={addCustomTag} variant="outline">
              Add
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(tags);
              onClose();
            }}
            className="flex-1 bg-[#1976d2] hover:bg-[#1565c0] text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
