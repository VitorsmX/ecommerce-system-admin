"use client"

import { Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Heading } from "@/components/ui/heading"
import { Separator } from "@/components/ui/separator"
import { DescriptionColumn, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { ApiList } from "@/components/ui/api-list"

interface DescriptionClientProps {
    data: DescriptionColumn[]
}

export const DescriptionClient: React.FC<DescriptionClientProps> = ({
    data
}) => {
    const router = useRouter();
    const params = useParams();

    return (
        <>
            <div className="flex items-center justify-between">
                <Heading 
                    title={`Descrições (${data.length})`}
                    description="Gerencie as descrições dos produtos da sua loja"
                />
                <Button onClick={() => router.push(`/${params.storeId}/descriptions/new`)}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Adicionar Nova
                </Button>
            </div>
            <Separator />
            <DataTable searchKey="description" columns={columns} data={data} />
            <Heading title="API" description="Chamadas de API para as descrições" />
            <Separator />
            <ApiList entityName="descriptions" entityIdName="descriptionId" />
        </>
    )
}