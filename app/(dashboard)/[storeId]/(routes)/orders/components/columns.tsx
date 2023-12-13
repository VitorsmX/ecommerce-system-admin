"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action";
import { OrderItem } from "@prisma/client";

export type OrderColumn = {
  id: string;
  phone: string;
  address: string;
  isPaid: boolean;
  totalPrice: string;
  products: string;
  createdAt: string;
  orderItems: OrderItem[];
  quantity: string;
  quantityPerItem: string;
}

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "products",
    header: "Produtos",
  },
  {
    accessorKey: "phone",
    header: "Telefone",
  },
  {
    accessorKey: "address",
    header: "Endereço",
  },
  {
    accessorKey: "totalPrice",
    header: "Preço total",
  },
  {
    accessorKey: "quantityPerItem",
    header: "Quantidade por Item",
    cell: ({ row }) => <div className="flex items-center p-2 m-1 bg-neutral-600 text-white border-[2px] rounded-sm border-black">{row.original.quantityPerItem}</div>
  },
  {
    accessorKey: "quantity",
    header: "Total de items"
  },
  {
    accessorKey: "isPaid",
    header: "Pago",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />
  }
]
