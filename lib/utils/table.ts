// Types pour les tables
export type ColumnDef<TData> = {
  accessorKey: keyof TData
  header: string
  cell?: (props: { row: { original: TData } }) => React.ReactNode
  enableSorting?: boolean
  enableFiltering?: boolean
  filterFn?: string
}

export type TableOptions<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  searchKey?: string
  pageSize?: number
  enableRowSelection?: boolean
  onRowClick?: (row: TData) => void
}