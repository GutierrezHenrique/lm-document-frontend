import { type InputHTMLAttributes, forwardRef } from 'react';

export interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  accept?: string;
  error?: string;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ className = '', label, accept, error, id: idProp, ...props }, ref) => {
    const id = idProp ?? `file-${Math.random().toString(36).slice(2, 9)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-400">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="file"
          id={id}
          accept={accept}
          data-testid="file-input"
          className={`
            block w-full text-sm text-stone-300
            file:mr-3 file:rounded file:border-0 file:bg-amber-500/20 file:px-3 file:py-1.5 file:text-amber-400 file:transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-0
            disabled:opacity-50
            ${className}
          `}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
FileInput.displayName = 'FileInput';
