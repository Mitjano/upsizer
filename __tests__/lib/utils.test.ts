import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('utils.ts', () => {
  describe('cn', () => {
    it('should merge simple class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes with clsx', () => {
      const isActive = true;
      const isDisabled = false;

      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('should handle object syntax for conditional classes', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('should handle array of classes', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });

    it('should deduplicate conflicting Tailwind classes', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('should handle conflicting margin classes', () => {
      expect(cn('mt-2', 'mt-4')).toBe('mt-4');
    });

    it('should handle conflicting color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle conflicting background classes', () => {
      expect(cn('bg-white', 'bg-gray-100')).toBe('bg-gray-100');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('p-4', 'text-red-500', 'bg-white')).toBe('p-4 text-red-500 bg-white');
    });

    it('should handle undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('should handle null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('should handle empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    it('should return empty string when no classes provided', () => {
      expect(cn()).toBe('');
    });

    it('should handle complex responsive classes', () => {
      expect(cn('md:p-4', 'md:p-6')).toBe('md:p-6');
    });

    it('should preserve different responsive breakpoints', () => {
      expect(cn('sm:p-2', 'md:p-4', 'lg:p-6')).toBe('sm:p-2 md:p-4 lg:p-6');
    });

    it('should handle hover state classes', () => {
      expect(cn('hover:bg-blue-500', 'hover:bg-red-500')).toBe('hover:bg-red-500');
    });

    it('should handle dark mode classes', () => {
      expect(cn('dark:bg-gray-800', 'dark:bg-gray-900')).toBe('dark:bg-gray-900');
    });

    it('should handle mixed conditional and static classes', () => {
      const isLoading = true;
      const isError = false;

      const result = cn(
        'btn',
        'btn-primary',
        isLoading && 'opacity-50 cursor-wait',
        isError && 'btn-error'
      );

      expect(result).toBe('btn btn-primary opacity-50 cursor-wait');
    });

    it('should handle flex and grid classes', () => {
      expect(cn('flex', 'grid')).toBe('grid');
      expect(cn('flex-row', 'flex-col')).toBe('flex-col');
    });

    it('should handle justify and align classes', () => {
      expect(cn('justify-start', 'justify-center')).toBe('justify-center');
      expect(cn('items-start', 'items-center')).toBe('items-center');
    });

    it('should handle width and height classes', () => {
      expect(cn('w-full', 'w-auto')).toBe('w-auto');
      expect(cn('h-screen', 'h-full')).toBe('h-full');
    });

    it('should handle rounded classes', () => {
      expect(cn('rounded', 'rounded-lg')).toBe('rounded-lg');
      expect(cn('rounded-none', 'rounded-full')).toBe('rounded-full');
    });

    it('should handle font classes', () => {
      expect(cn('font-normal', 'font-bold')).toBe('font-bold');
      expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    });

    it('should handle border classes', () => {
      expect(cn('border', 'border-2')).toBe('border-2');
      expect(cn('border-gray-200', 'border-gray-300')).toBe('border-gray-300');
    });

    it('should handle shadow classes', () => {
      expect(cn('shadow', 'shadow-lg')).toBe('shadow-lg');
      expect(cn('shadow-none', 'shadow-xl')).toBe('shadow-xl');
    });

    it('should handle opacity classes', () => {
      expect(cn('opacity-50', 'opacity-100')).toBe('opacity-100');
    });

    it('should handle z-index classes', () => {
      expect(cn('z-10', 'z-50')).toBe('z-50');
    });

    it('should handle real-world component example', () => {
      const buttonClasses = cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        // Disabled styles
        'disabled:pointer-events-none disabled:opacity-50',
        // Variant
        'bg-primary text-primary-foreground hover:bg-primary/90',
        // Size override
        'h-10 px-4 py-2',
        // Custom override
        'px-8' // Should override px-4
      );

      expect(buttonClasses).toContain('px-8');
      expect(buttonClasses).not.toContain('px-4');
    });
  });
});
