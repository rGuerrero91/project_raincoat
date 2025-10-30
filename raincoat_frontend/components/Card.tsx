import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  hover = false,
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover ? 'card-hover cursor-pointer' : '';
  const clickableStyles = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`card ${paddingStyles[padding]} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
