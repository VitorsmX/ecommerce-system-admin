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

        const { orderItems } = body;

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

        const order = await prismadb.order.findUnique({
            where: {
                id: params.orderId
            },
            include: {
                orderItems: true
            }
        })

        if (!order) {
            return new NextResponse("Order not found", { status: 404 })
        }

        await Promise.all(order.orderItems.map(async (orderItem: OrderItem) => {
            await prismadb.orderItem.delete({
                where: {
                    id: orderItem.id,
                    productId: orderItem.productId,
                }
            });
        }))

        await prismadb.order.delete({
            where: {
                id: params.orderId
            }
        })

        return new NextResponse("Order deleted successfully", { status: 200 })

    } catch (error) {
        console.log(`[ORDER_POST(DELETE)`, error);
        return new NextResponse(`Internal error ${error}`, { status: 500 })
    }
}
