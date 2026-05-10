import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
  dashed?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ clickable = false, dashed = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          bg-card border rounded-lg p-4
          ${dashed ? 'border-dashed border-2 border-border' : 'border border-border'}
          ${clickable ? 'cursor-pointer hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
