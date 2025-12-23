// /components/ui/data-table.tsx
'use client'

import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  Row,
} from '@tanstack/react-table'
import { DataTablePagination } from './pagination'
import { Search, Filter, Download, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from '../ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  placeholder?: string
  onRowClick?: (row: Row<TData>) => void
  enableRowSelection?: boolean
  onDeleteSelected?: (selectedRows: TData[]) => void
  onExportSelected?: (selectedRows: TData[]) => void
  className?: string
  showToolbar?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  placeholder = "Rechercher...",
  onRowClick,
  enableRowSelection = false,
  onDeleteSelected,
  onExportSelected,
  className,
  showToolbar = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
  })

  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar avec recherche et actions */}
      {showToolbar && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto sm:min-w-75">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(onDeleteSelected || onExportSelected) && selectedRows.length > 0 && (
              <>
                {onDeleteSelected && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteSelected(selectedRows)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer ({selectedRows.length})
                  </Button>
                )}
                {onExportSelected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExportSelected(selectedRows)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exporter ({selectedRows.length})
                  </Button>
                )}
              </>
            )}
            
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}