import { TableCell, TableRow, Skeleton } from "@/components";

type Props = {
  columnCount: number;

  rowCount?: number;
};

export function DataTableLoading({ columnCount, rowCount = 8 }: Props) {
  return (
    <>
      {Array.from({
        length: rowCount,
      }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({
            length: columnCount,
          }).map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
