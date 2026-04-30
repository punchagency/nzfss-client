"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Input } from "./ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"


const data: Dogs[] = [
  {
    id: "m5gr84i9",
    name: '316',
    NZFSSRegistration: "success",
    dob: "4 april",
    breed: "Husky",
  },
  {
    id: "3u1reuv4",
    name: '242',
    NZFSSRegistration: "success",
    dob: "4 april",
    breed: "Husky",
  },
  {
    id: "derv1ws0",
    name: '837',
    NZFSSRegistration: "processing",
    dob: "4 april",
    breed: "Husky",
  },
  {
    id: "5kma53ae",
    name: '874',
    NZFSSRegistration: "success",
    dob: "4 april",
    breed: "Husky",
  },
  {
    id: "bhqecj4p",
    name: '721',
    NZFSSRegistration: "failed",
    dob: "4 april",
    breed: "Husky",
  }
]

export type Dogs = {
  id?: string
  name: string
  pedigreeName?: string // Add pedigree name field
  NZFSSRegistration: string
  dob: string | null // Allow null for optional DOB
  breed: string
}

export const columns: ColumnDef<Dogs>[] = [
  {
    id: "select",
    header: () => null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header:  () => <div className="text-[14px] font-[600]">Name</div>,
    cell: ({ row }) => (
      <div className="capitalize text-[14px] font-[600] ">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "NZFSSRegistration",
    header:  () => <div className="text-center text-[14px] font-[600]">NZFSS Registration</div>,
    cell: ({ row }) => (
      <div className="capitalize text-[14px] font-[600] text-center">{row.getValue("NZFSSRegistration")}</div>
    ),
  },
  {
    accessorKey: "dob",
    header: () => <div className="text-center text-[14px] font-[600]">Date of birth</div>,
    cell: ({ row }) => (
      <div className="capitalize text-[14px] font-[600] text-center">{row.getValue("dob") || "-"}</div>
    ),
  },
  {
    accessorKey: "breed",
    header:  () => <div className="text-center text-[14px] font-[600]">Breed</div>,
    cell: ({ row }) => (
      <div className="capitalize text-[14px] font-[600] text-center">{row.getValue("breed")}</div>
    ),
  }
]

interface DataTableProps {
  setSelectedRows: React.Dispatch<React.SetStateAction<Dogs[]>>;
}

export function DataTable({setSelectedRows}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  React.useEffect(() => {
    const selectedData = table.getSelectedRowModel().rows.map(row => row.original)
    setSelectedRows(selectedData)
  }, [rowSelection, table, setSelectedRows])


  return (
    <div className="w-full">
      <div className="">
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
