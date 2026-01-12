'use client'

/**
 * SortableDataTable Component
 * Reusable table with sortable columns for all data boards
 * 
 * Features:
 * - Click column headers to sort ASC/DESC
 * - Visual indicators for sort direction
 * - Sticky headers for large tables
 * - Responsive design with horizontal scroll
 * - Custom cell renderers
 * - Row click handlers
 */

import { useState, useMemo, useCallback } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ArrowUpDown } from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null

export interface ColumnDef<T> {
  key: string
  header: string
  sortable?: boolean
  width?: string
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  sticky?: boolean
  className?: string
  headerClassName?: string
  // Custom sort function (for complex data types)
  sortFn?: (a: T, b: T, direction: SortDirection) => number
  // Custom cell renderer
  render?: (value: unknown, row: T, index: number) => React.ReactNode
  // For nested properties (e.g., "spread.homePublicPct")
  accessor?: (row: T) => unknown
}

export interface SortableDataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  defaultSort?: { key: string; direction: SortDirection }
  onRowClick?: (row: T, index: number) => void
  rowKey?: (row: T, index: number) => string
  emptyMessage?: string
  className?: string
  headerClassName?: string
  rowClassName?: string | ((row: T, index: number) => string)
  stickyHeader?: boolean
  maxHeight?: string
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
  loading?: boolean
}

// =============================================================================
// SORT ICON COMPONENT
// =============================================================================

function SortIcon({ direction, active }: { direction: SortDirection; active: boolean }) {
  if (!active) {
    return <ChevronsUpDown className="w-4 h-4 text-gray-400" />
  }
  
  if (direction === 'asc') {
    return <ChevronUp className="w-4 h-4 text-blue-500" />
  }
  
  if (direction === 'desc') {
    return <ChevronDown className="w-4 h-4 text-blue-500" />
  }
  
  return <ArrowUpDown className="w-4 h-4 text-gray-400" />
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getNestedValue<T>(obj: T, path: string): unknown {
  const keys = path.split('.')
  let value: unknown = obj
  
  for (const key of keys) {
    if (value === null || value === undefined) return undefined
    value = (value as Record<string, unknown>)[key]
  }
  
  return value
}

function defaultSortFn<T>(
  a: T,
  b: T,
  key: string,
  direction: SortDirection,
  accessor?: (row: T) => unknown
): number {
  const aVal = accessor ? accessor(a) : getNestedValue(a, key)
  const bVal = accessor ? accessor(b) : getNestedValue(b, key)
  
  // Handle null/undefined
  if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1
  if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1
  
  // Handle numbers
  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return direction === 'asc' ? aVal - bVal : bVal - aVal
  }
  
  // Handle strings
  const aStr = String(aVal).toLowerCase()
  const bStr = String(bVal).toLowerCase()
  
  if (direction === 'asc') {
    return aStr.localeCompare(bStr)
  }
  return bStr.localeCompare(aStr)
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SortableDataTable<T>({
  data,
  columns,
  defaultSort,
  onRowClick,
  rowKey,
  emptyMessage = 'No data available',
  className = '',
  headerClassName = '',
  rowClassName,
  stickyHeader = true,
  maxHeight,
  striped = true,
  hoverable = true,
  compact = false,
  loading = false,
}: SortableDataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({
    key: defaultSort?.key || '',
    direction: defaultSort?.direction || null,
  })
  
  // Handle column header click
  const handleSort = useCallback((columnKey: string, sortable?: boolean) => {
    if (!sortable) return
    
    setSortConfig(prev => {
      if (prev.key !== columnKey) {
        return { key: columnKey, direction: 'desc' }
      }
      
      if (prev.direction === 'desc') {
        return { key: columnKey, direction: 'asc' }
      }
      
      if (prev.direction === 'asc') {
        return { key: '', direction: null }
      }
      
      return { key: columnKey, direction: 'desc' }
    })
  }, [])
  
  // Sort the data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data
    }
    
    const column = columns.find(c => c.key === sortConfig.key)
    if (!column) return data
    
    return [...data].sort((a, b) => {
      if (column.sortFn) {
        return column.sortFn(a, b, sortConfig.direction)
      }
      return defaultSortFn(a, b, sortConfig.key, sortConfig.direction, column.accessor)
    })
  }, [data, sortConfig, columns])
  
  // Get row key
  const getRowKey = useCallback((row: T, index: number): string => {
    if (rowKey) return rowKey(row, index)
    return String(index)
  }, [rowKey])
  
  // Get row class
  const getRowClass = useCallback((row: T, index: number): string => {
    const base = [
      compact ? 'py-2' : 'py-3',
      hoverable && onRowClick ? 'cursor-pointer hover:bg-blue-500/10' : hoverable ? 'hover:bg-gray-800/50' : '',
      striped && index % 2 === 1 ? 'bg-gray-900/30' : '',
    ].filter(Boolean).join(' ')
    
    if (typeof rowClassName === 'function') {
      return `${base} ${rowClassName(row, index)}`
    }
    
    return `${base} ${rowClassName || ''}`
  }, [compact, hoverable, striped, onRowClick, rowClassName])
  
  // Get cell value
  const getCellValue = useCallback((row: T, column: ColumnDef<T>, index: number): React.ReactNode => {
    if (column.render) {
      const value = column.accessor ? column.accessor(row) : getNestedValue(row, column.key)
      return column.render(value, row, index)
    }
    
    const value = column.accessor ? column.accessor(row) : getNestedValue(row, column.key)
    
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'number') {
      // Format percentages
      if (column.key.toLowerCase().includes('pct') || column.key.toLowerCase().includes('percent')) {
        return `${value}%`
      }
      // Format money/odds
      if (column.key.toLowerCase().includes('odds') || column.key.toLowerCase().includes('ml')) {
        return value > 0 ? `+${value}` : String(value)
      }
      // Format with decimals if needed
      if (!Number.isInteger(value)) {
        return value.toFixed(1)
      }
    }
    
    return String(value)
  }, [])
  
  // Loading skeleton
  if (loading) {
    return (
      <div className={`rounded-lg border border-gray-800 overflow-hidden ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-800/50" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 border-t border-gray-800/50 bg-gray-900/30" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className={`rounded-lg border border-gray-800 overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className={`bg-gray-900/80 backdrop-blur-sm ${headerClassName}`}>
              {columns.map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key, column.sortable)}
                  className={[
                    'px-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400',
                    compact ? 'py-2' : 'py-3',
                    column.sortable ? 'cursor-pointer select-none hover:text-white transition-colors' : '',
                    column.sticky ? 'sticky left-0 bg-gray-900/80 backdrop-blur-sm z-20' : '',
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : '',
                    column.headerClassName || '',
                  ].filter(Boolean).join(' ')}
                  style={{ 
                    width: column.width,
                    minWidth: column.minWidth,
                  }}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <SortIcon 
                        direction={sortConfig.key === column.key ? sortConfig.direction : null}
                        active={sortConfig.key === column.key}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="divide-y divide-gray-800/50">
            {sortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr
                  key={getRowKey(row, rowIndex)}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                  className={getRowClass(row, rowIndex)}
                >
                  {columns.map(column => (
                    <td
                      key={column.key}
                      className={[
                        'px-3 text-sm whitespace-nowrap',
                        compact ? 'py-2' : 'py-3',
                        column.sticky ? 'sticky left-0 bg-gray-950 z-10' : '',
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : '',
                        column.className || '',
                      ].filter(Boolean).join(' ')}
                      style={{ 
                        width: column.width,
                        minWidth: column.minWidth,
                      }}
                    >
                      {getCellValue(row, column, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =============================================================================
// PRE-BUILT CELL RENDERERS
// =============================================================================

export const CellRenderers = {
  // Percentage with color coding (green for high, red for low)
  percentage: (threshold = 50) => (value: unknown) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(num)) return '-'
    
    const color = num >= threshold + 10 
      ? 'text-green-400' 
      : num <= threshold - 10 
        ? 'text-red-400' 
        : 'text-gray-300'
    
    return <span className={color}>{num}%</span>
  },
  
  // Spread/line with +/- formatting
  spread: (value: unknown) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(num)) return '-'
    return num > 0 ? `+${num}` : String(num)
  },
  
  // Money line with color (favorite vs underdog)
  moneyline: (value: unknown) => {
    const num = typeof value === 'number' ? value : parseInt(String(value))
    if (isNaN(num)) return '-'
    
    const formatted = num > 0 ? `+${num}` : String(num)
    const color = num > 0 ? 'text-green-400' : 'text-red-400'
    
    return <span className={color}>{formatted}</span>
  },
  
  // Boolean indicator (checkmark/x)
  boolean: (trueLabel = '✓', falseLabel = '✗') => (value: unknown) => {
    const bool = Boolean(value)
    return (
      <span className={bool ? 'text-green-400' : 'text-gray-600'}>
        {bool ? trueLabel : falseLabel}
      </span>
    )
  },
  
  // Confidence bar
  confidence: (value: unknown) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(num)) return '-'
    
    const width = Math.min(100, Math.max(0, num))
    const color = num >= 70 ? 'bg-green-500' : num >= 40 ? 'bg-yellow-500' : 'bg-gray-600'
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
        </div>
        <span className="text-xs text-gray-400">{num}%</span>
      </div>
    )
  },
  
  // Sharp indicator badge
  sharpIndicator: (value: unknown) => {
    if (!value) return <span className="text-gray-600">-</span>
    
    return (
      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">
        {String(value).toUpperCase()}
      </span>
    )
  },
  
  // RLM indicator
  rlmIndicator: (value: unknown, row: unknown) => {
    const isRLM = Boolean(value)
    if (!isRLM) return <span className="text-gray-600">-</span>
    
    return (
      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium flex items-center gap-1">
        ⚠️ RLM
      </span>
    )
  },
  
  // Team name with optional logo
  teamName: (getLogoUrl?: (name: string) => string) => (value: unknown) => {
    const name = String(value)
    
    if (getLogoUrl) {
      return (
        <div className="flex items-center gap-2">
          <img 
            src={getLogoUrl(name)} 
            alt={name}
            className="w-5 h-5 object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span>{name}</span>
        </div>
      )
    }
    
    return <span className="font-medium">{name}</span>
  },
  
  // Trend direction arrow
  trend: (value: unknown) => {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(num)) return '-'
    
    if (num > 0) {
      return <span className="text-green-400">↑ {num}</span>
    }
    if (num < 0) {
      return <span className="text-red-400">↓ {Math.abs(num)}</span>
    }
    return <span className="text-gray-400">→ 0</span>
  },
}

export default SortableDataTable
