import { format } from "date-fns"

import prismadb from "@/lib/prismadb";
import { DescriptionClient } from "./components/client";
import { DescriptionColumn } from "./components/columns";

const DescriptionPage = async ({
    params
}: {
    params: { storeId: string }
}) => {

    const descriptions = await prismadb.description.findMany({
        where: {
            storeId: params.storeId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedDescriptions: DescriptionColumn[] = descriptions.map((item) => ({
        id: item.id,
        description: item.description,
        createdAt: format(item.createdAt, "MMMM do, yyyy")
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <DescriptionClient data={formattedDescriptions} />
            </div>
        </div>
    )
}

export default DescriptionPage;