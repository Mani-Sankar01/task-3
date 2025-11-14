"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"


const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Aggressive cleanup of body styles
  React.useEffect(() => {
    const cleanupBodyStyles = () => {
      // Check if any dialog is actually open
      const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
      if (openDialogs.length === 0) {
        const body = document.body;
        if (body) {
          // Force remove pointer-events
          if (body.style.pointerEvents === "none") {
            body.style.removeProperty("pointer-events");
          }
          // Remove scroll lock attribute
          if (body.hasAttribute("data-scroll-locked")) {
            body.removeAttribute("data-scroll-locked");
          }
        }
      }
    };

    // Use MutationObserver on body to detect style changes
    const bodyObserver = new MutationObserver(() => {
      cleanupBodyStyles();
    });

    // Observe body for style and attribute changes
    const body = document.body;
    if (body) {
      bodyObserver.observe(body, {
        attributes: true,
        attributeFilter: ["style", "data-scroll-locked"],
      });
    }

    // Also observe the dialog content element
    const timeoutId = setTimeout(() => {
      const content = contentRef.current;
      if (!content) return;

      const dialogObserver = new MutationObserver(() => {
        const isOpen = content.getAttribute("data-state") === "open";
        if (!isOpen) {
          // Run cleanup multiple times with delays
          cleanupBodyStyles();
          setTimeout(cleanupBodyStyles, 50);
          setTimeout(cleanupBodyStyles, 100);
          setTimeout(cleanupBodyStyles, 200);
          setTimeout(cleanupBodyStyles, 300);
          setTimeout(cleanupBodyStyles, 500);
        }
      });

      dialogObserver.observe(content, {
        attributes: true,
        attributeFilter: ["data-state"],
      });

      // Store for cleanup
      (content as any)._dialogObserver = dialogObserver;
    }, 0);

    // Also set up interval as fallback
    const intervalId = setInterval(cleanupBodyStyles, 200);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      bodyObserver.disconnect();
      
      const content = contentRef.current;
      if (content && (content as any)._dialogObserver) {
        (content as any)._dialogObserver.disconnect();
      }
      
      // Final cleanup
      cleanupBodyStyles();
    };
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref && typeof ref === "object" && "current" in ref) {
            // Use any to bypass readonly check for ref.current
            (ref as any).current = node;
          }
        }}
        onAnimationEnd={(e) => {
          // Cleanup when closing animation ends
          if (e.currentTarget.getAttribute("data-state") === "closed") {
            const body = document.body;
            if (body && body.style.pointerEvents === "none") {
              body.style.removeProperty("pointer-events");
            }
            if (body && body.hasAttribute("data-scroll-locked")) {
              body.removeAttribute("data-scroll-locked");
            }
          }
          props.onAnimationEnd?.(e);
        }}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
