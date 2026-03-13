import React, { useMemo } from 'react';
import Papa from 'papaparse';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';

const MAX_DISPLAY_ROWS = 4000;

export default function CsvTablePreview({ content }) {
  const { headers, rows, totalRows } = useMemo(() => {
    const result = Papa.parse(content, { header: true, skipEmptyLines: true });
    const headers = result.meta.fields || [];
    const totalRows = result.data.length;
    const rows = result.data.slice(0, MAX_DISPLAY_ROWS);
    return { headers, rows, totalRows };
  }, [content]);

  if (!headers.length) {
    return <p className="p-6 text-dark-text-secondary text-sm">No CSV data detected.</p>;
  }

  return (
    <div className="overflow-auto h-full">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-dark-bg-secondary">
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {headers.map((h) => (
                <TableCell key={h}>{row[h]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalRows > MAX_DISPLAY_ROWS && (
        <p className="text-center text-dark-text-secondary text-xs py-3 border-t border-dark-border">
          Showing {MAX_DISPLAY_ROWS} of {totalRows} rows
        </p>
      )}
    </div>
  );
}
