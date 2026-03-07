import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
import { cn } from '../../lib/utils';

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 px-3 py-1.5 rounded-full',
      'border border-btn-border bg-btn-bg text-btn-text',
      'text-[0.8rem] font-semibold cursor-pointer',
      'transition-all duration-200 hover:bg-btn-hover hover:-translate-y-px',
      'focus:outline-none',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <IconChevronDown size={14} className="opacity-70" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position="popper"
      sideOffset={6}
      className={cn(
        'z-[1100] min-w-[180px] overflow-hidden rounded-lg',
        'border border-dropdown-border bg-dropdown-bg text-dropdown-text',
        'shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
        'data-[state=open]:animate-fade-in',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectGroup = SelectPrimitive.Group;

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-dark-text-secondary',
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = 'SelectLabel';

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex items-center gap-2 px-3 py-1.5 rounded-md text-[0.8rem] cursor-pointer',
      'outline-none transition-colors duration-150',
      'data-[highlighted]:bg-dropdown-hover',
      'data-[state=checked]:font-semibold',
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="ml-auto">
      <IconCheck size={12} />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('h-px my-1 bg-dark-border', className)}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
