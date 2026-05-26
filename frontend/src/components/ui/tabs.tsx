"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { useWheelToHorizontalScroll } from "@/hooks/use-wheel-to-horizontal";

const Tabs = TabsPrimitive.Root;

const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, forwardedRef) => {
  const ref = useRef<React.ElementRef<typeof TabsPrimitive.List>>(null);

  useImperativeHandle(
    forwardedRef,
    () => ref.current as React.ElementRef<typeof TabsPrimitive.List>,
    [],
  );

  useWheelToHorizontalScroll({ ref });

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 max-w-full min-w-0 items-center justify-[safe_center] overflow-x-auto rounded-md bg-muted p-1 text-muted-foreground scrollbar-hidden",
        className,
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all hover:bg-accent/50 outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-2 outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
