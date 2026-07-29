import { type ChangeEvent } from 'react';
import { cn } from '@/utils/cn';
import Input from '../Input';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function SearchBar({ value, onChange, placeholder = 'Search', className }: SearchBarProps) {
  return (
    <div className={cn('w-full', className)}>
      <Input
        label="Search"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        wrapperClassName="space-y-0"
        labelClassName="sr-only"
        startIcon={
          <span aria-hidden="true" className="text-base leading-none">
            🔎
          </span>
        }
      />
    </div>
  );
}

export default SearchBar;
