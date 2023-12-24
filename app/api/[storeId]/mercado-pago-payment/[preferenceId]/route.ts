import prismadb from "@/lib/prismadb";
import { OrderItem } from "@prisma/client";
import MercadoPagoConfig, { Payment } from "mercadopago";
import { NextResponse } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, DELETE, PATCH, POST, PUT",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
  }

export async function POST(
    req: Request,
    { params }:
        {
            params:
            {
                storeId: string
                preferenceId: string
            }
        }
) {
    try {
        const body = await req.json();

        const {
            action,

            api_version,

            application_id,

            date_created,

            id,

            live_mode,

            type,

            user_id,

            data
        } = body;

        if (!params.storeId) {
            return new NextResponse("Store id required", { status: 400 })
        }

        if (!params.preferenceId) {
            return new NextResponse("Preference id required", { status: 400 })
        }

        const store = await prismadb.store.findUnique({
            where: {
                id: params.storeId
            }
        })

        if (!store) {
            return new NextResponse("Unauthorized", { status: 405 })
        }

        if (type === "payment") {
            if (action === "payment.created") {
                if (data.id) {
                    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN! });

                    const payment = new Payment(client);

                    const UniquePayment = await payment.get({
                        id: data.id
                    })

                    const isPaid = UniquePayment.status === "approved" ? true : false

                    const address = UniquePayment.payer?.address

                    const addressComponents = [
                        address?.street_name,
                        address?.street_number,
                        address?.zip_code
                    ]

                    const addressString = addressComponents.filter((c) => c !== null).join(', ');

                    const phone = `${UniquePayment.payer?.phone?.area_code} ${UniquePayment.payer?.phone?.extension} ${UniquePayment.payer?.phone?.number}`

                    const order = await prismadb.order.update({
                        where: {
                            id: params.preferenceId
                        },
                        data: {
                            isPaid: isPaid,
                            address: addressString || '',
                            phone: `${phone}` || ''
                        },
                        include: {
                            orderItems: true,
                        }
                    })

                    const productIds = order.orderItems.map((orderItem) => orderItem.productId);

                    await prismadb.product.updateMany({
                        where: {
                            id: {
                                in: [...productIds]
                            }
                        },
                        data: {
                            isArchived: true
                        }
                    })

                    return new NextResponse(`${data.id} - ${order.id}`, { status: 200 })
                }
            }
        }

        return new NextResponse("PAYMENT_NOTIFICATION_POST", { status: 200 })

    } catch (error) {
        console.log(`PAYMENT_NOTIFICATION_POST`, error);
        return new NextResponse(`Internal error ${error}`, { status: 200 })
    }
}
