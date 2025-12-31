import React from 'react';

interface TagProps {
  label: string;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export default function Tag({ label, removable = false, onRemove, className = '' }: TagProps) {
  return (
    <span
      className={`tag ${removable ? 'tag-removable' : ''} ${className}`}
      onClick={removable ? onRemove : undefined}
      role={removable ? 'button' : undefined}
      tabIndex={removable ? 0 : undefined}
      onKeyDown={
        removable && onRemove
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRemove();
              }
            }
          : undefined
      }
    >
      {label}
      {removable && (
        <svg
          className="ml-1.5 h-4 w-4 inline-block"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
