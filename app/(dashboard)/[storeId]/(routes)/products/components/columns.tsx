"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action";

export type ProductColumn = {
  id: string;
  name: string;
  price: string;
  size: string;
  category: string;
  brand: string;
  description: string;
  isFeatured: boolean;
  isArchived: boolean;
  quantity: number;
  createdAt: string;
}

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "isArchived",
    header: "Arquivado"
  },
  {
    accessorKey: "isFeatured",
    header: "Destacado"
  },
  {
    accessorKey: "price",
    header: "Preço"
  },
  {
    accessorKey: "category",
    header: "Categoria"
  },
  {
    accessorKey: "size",
    header: "Tamanho"
  },
  {
    accessorKey: "brand",
    header: "Marca"
  },
  {
    accessorKey: "description",
    header: "Descrição"
  },
  {
    accessorKey: "quantity",
    header: "Quantidade"
  },
  {
    accessorKey: "createdAt",
    header: "Data"
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />
  }
]
