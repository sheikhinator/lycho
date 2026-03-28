import { ReactNode } from 'react'

export interface Column<T> {
  key: keyof T
  header: string
  render?: (value: T[keyof T], row: T) => ReactNode
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField?: keyof T
}

export function Table<T extends object>({
  columns,
  data,
  keyField,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-deep">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-xs font-medium text-gold uppercase tracking-widest border-b border-border"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const rowKey = keyField ? String(row[keyField]) : i
            return (
              <tr
                key={rowKey}
                className="border-b border-border/40 last:border-b-0 hover:bg-surface/60 transition-colors"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 text-ivory">
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
