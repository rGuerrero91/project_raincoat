import React from 'react';

interface TagProps {
  label: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export default function Tag({
  label,
  removable = false,
  onRemove,
  className = '',
}: TagProps) {
  return (
    <span
      className={`tag ${removable ? 'tag-removable' : ''} ${className}`}
      onClick={removable ? onRemove : undefined}
    >
      {label}
      {removable && (
        <svg
          className="ml-1 h-4 w-4 inline-block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </span>
  );
}
