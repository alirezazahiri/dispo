import { TableCell, TableRow } from "@/components";

type Props = {
  colSpan: number;

  message?: string;
};

export function DataTableEmpty({ colSpan, message = "No results." }: Props) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="
            h-32 text-center
            text-sm text-muted-foreground
          "
      >
        {message}
      </TableCell>
    </TableRow>
  );
}
