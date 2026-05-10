import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full px-3 py-2 text-[13px]
          bg-surface border border-border rounded-lg
          text-text-primary cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-colors duration-150 hover:border-primary/50
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;
