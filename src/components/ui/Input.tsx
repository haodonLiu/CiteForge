import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 text-[13px]
          bg-surface border border-border rounded-lg
          text-text-primary placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-colors duration-150 hover:border-primary/50
          ${className}
        `.trim()}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
