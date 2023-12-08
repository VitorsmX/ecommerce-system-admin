import { OrderColumn } from "@/app/(dashboard)/[storeId]/(routes)/orders/components/columns";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { OrderItem } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }:
        {
            params:
            {
                storeId: string,
                orderId: string
            }
        }
) {
    try {
        const { userId } = auth();
        const body = await req.json();

        const { data }: { data: OrderColumn } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!params.orderId) {
            return new NextResponse("Store id is required", { status: 400 })
        }

        const storeByUserId = await prismadb.store.findFirst({
            where: {
                id: params.storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        await Promise.all(data.orderItems.map(async (orderItem: OrderItem) => {
            await prismadb.orderItem.deleteMany({
                where: {
                    productId: orderItem.productId,
                }
            });
        }))

        const order = await prismadb.order.delete({
                where: {
                    id: params.orderId
                }
            })

        return NextResponse.json(order)

    } catch (error) {
        console.log(`[ORDER_POST(DELETE)] ${error}`, error);
        return new NextResponse("Internal error", { status: 500 })
    }
}