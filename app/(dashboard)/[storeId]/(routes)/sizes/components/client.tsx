"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { useParams, useRouter } from "next/navigation"
import { SizeColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { ApiList } from "@/components/ui/api-list"

interface SizesClientProps {
    data: SizeColumn[]
}

export const SizesClient: React.FC<SizesClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading 
                    title={`Tamanhos (${data.length})`}
                    description="Gerencie os tamanhos dos elementos da sua loja"
                />
                <Button onClick={() => router.push(`/${params.storeId}/sizes/new`)}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Adicionar Novo
                </Button>
            </div>
            <Separator />
            <DataTable searchKey="name" columns={columns} data={data} />
            <Heading title="API" description="Chamadas de API para os tamanhos" />
            <Separator />
            <ApiList entityName="sizes" entityIdName="sizeId" />
        </>
    )
}