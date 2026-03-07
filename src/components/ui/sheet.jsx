import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[1000] bg-black/50',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const SheetContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed right-0 top-0 z-[1001] h-full w-[380px] max-w-[90vw]',
        'bg-page-bg border-l border-dark-border',
        'flex flex-col animate-slide-in-right focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }) => (
  <div
    className={cn(
      'flex justify-between items-center p-4 border-b border-dark-border',
      className
    )}
    {...props}
  />
);

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('flex items-center gap-2 font-bold text-[0.95rem] text-page-text', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
};
