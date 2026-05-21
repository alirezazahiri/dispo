import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to?: string;
};

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active,
  to,
}) => {
  const content = (isActive: boolean) => (
    <>
      <span
        className="
            flex h-4 w-4 shrink-0
            items-center justify-center
          "
      >
        {icon}
      </span>

      <span className="truncate">{label}</span>
    </>
  );

  const baseClassName = `
      flex w-full items-center gap-2 rounded-md px-2 py-2
      text-sm transition-colors
    `;

  if (to) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            baseClassName,
            isActive
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )
        }
      >
        {({ isActive }) => content(isActive)}
      </NavLink>
    );
  }

  return (
    <button
      className={cn(
        baseClassName,
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {content(Boolean(active))}
    </button>
  );
};
