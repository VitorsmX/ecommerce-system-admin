"use client"

import { Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { BrandColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { ApiList } from "@/components/ui/api-list"

interface BrandClientProps {
    data: BrandColumn[]
}

export const BrandClient: React.FC<BrandClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading 
                    title={`Marcas (${data.length})`}
                    description="Gerencie as marcas dos produtos da sua loja"
                />
                <Button onClick={() => router.push(`/${params.storeId}/brands/new`)}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Adicionar Nova
                </Button>
            </div>
            <Separator />
            <DataTable searchKey="name" columns={columns} data={data} />
            <Heading title="API" description="Chamadas de API para as marcas" />
            <Separator />
            <ApiList entityName="brands" entityIdName="brandId" />
        </>
    )
}