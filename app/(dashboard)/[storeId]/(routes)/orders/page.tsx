import { format } from "date-fns"

import prismadb from "@/lib/prismadb";
import { OrderClient } from "./components/client";
import { OrderColumn } from "./components/columns";
import { formatter } from "@/lib/utils";

const OrdersPage = async ({
    params
}: {
    params: { storeId: string }
}) => {

    const orders = await prismadb.order.findMany({
        where: {
            storeId: params.storeId
        },
        include: {
            orderItems: {
                include: {
                    product: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const formattedOrders: OrderColumn[] = orders.map((item) => ({
        id: item.id,
        phone: item.phone,
        address: item.address,
        products: item.orderItems.map((orderItem) => orderItem.product.name).join(', '),
        totalPrice: formatter.format(
            item.orderItems.reduce((total, orderItem) => {
                return total + (Number(orderItem.product.price) * orderItem.orderQuantity);
            }, 0)
        ),
        isPaid: item.isPaid,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
        orderItems: item.orderItems.map((orderItem) => orderItem),
        quantity: item.orderItems.reduce((total, orderItem) => {
            return total + orderItem.orderQuantity
        }, 0).toString(),
        quantityPerItem: item.orderItems.map((orderItem, index) => `${index + 1}º: Nome: ${orderItem.product.name} -> Quantidade: ${orderItem.orderQuantity}`).join(` ### `)
    }))

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <OrderClient data={formattedOrders} />
            </div>
        </div>
    )
}

export default OrdersPage;