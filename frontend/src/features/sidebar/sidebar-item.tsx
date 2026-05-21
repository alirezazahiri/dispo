import React from "react";

type SidebarItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active }) => {
  return (
    <button
      className={`
          flex w-full items-center gap-2 rounded-md px-2 py-2
          text-sm transition-colors
          ${
            active
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }
        `}
    >
      <span
        className="
            flex h-4 w-4 shrink-0
            items-center justify-center
          "
      >
        {icon}
      </span>

      <span className="truncate">{label}</span>
    </button>
  );
};
