import * as React from "react";
import { Check, Copy, CopyCheck } from "lucide-react";
import { cva } from "class-variance-authority";
import { toast } from "sonner";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const copyButtonVariants = cva("gap-2", {
  variants: {
    variant: {
      icon: `
          h-8 w-8 p-0
        `,

      inline: `
          h-7 gap-1 px-2
          text-xs
        `,

      toolbar: `
          h-8 px-3
        `,
    },
  },

  defaultVariants: {
    variant: "icon",
  },
});

type Props = {
  value: string;

  successMessage?: string;

  errorMessage?: string;

  variant?: "icon" | "inline" | "toolbar";

  className?: string;

  children?: React.ReactNode;
};

export function CopyButton({
  value,

  children,

  className,

  variant = "icon",

  successMessage = "Copied to clipboard",

  errorMessage = "Failed to copy",
}: Props) {
  const [copied, setCopied] = React.useState(false);

  const timeoutRef = React.useRef<number>();

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error(errorMessage);
    }
  };

  return (
    <Button
      size={variant === "icon" ? "icon" : "sm"}
      variant="outline"
      onClick={handleCopy}
      className={cn(
        copyButtonVariants({
          variant,
        }),
        className,
      )}
    >
      {copied ? (
        <>
          {variant === "icon" ? (
            <Check
              className="
                h-4 w-4
              "
            />
          ) : (
            <>
              <CopyCheck
                className="
                  h-4 w-4
                "
              />
              Copied
            </>
          )}
        </>
      ) : (
        <>
          <Copy
            className="
              h-4 w-4
            "
          />

          {variant !== "icon" && (children ?? "Copy")}
        </>
      )}
    </Button>
  );
}
