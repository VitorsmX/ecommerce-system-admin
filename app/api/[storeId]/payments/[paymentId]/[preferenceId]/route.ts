import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { stripe } from "@/lib/stripe"
import prismadb from "@/lib/prismadb"
import { PreferenceGetResponse } from "mercadopago/resources/preferences"
import { MercadoPagoConfig } from "mercadopago/dist/mercadoPagoConfig"
import { Payment } from "mercadopago/dist/clients/payment"
import { Preference } from "mercadopago/dist/clients/preference"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  
  export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
  }

export async function GET(
    req: Request,
    { params }: { params: { storeId: string, paymentId: string, preferenceId: string } }
) {

    try {

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN! });

    const payment = new Payment(client);

    const UniquePayment = await payment.search({
        options: {
            criteria: 'desc',
            sort: 'date_created',
            external_reference: 'ID_REF'
        }
    }).then(e => e.results?.filter(e => (e.id === params.paymentId)))

    if (UniquePayment) {
        const preferenceResponseIsPaid = UniquePayment[0].status === "approved" ? UniquePayment[0] : null

        if (preferenceResponseIsPaid) {
            const preference = new Preference(client);

            const UniquePreference = await preference.get({ preferenceId: `${params.preferenceId}` })

            const address = UniquePreference.payer?.address

            const addressComponents = [
                address?.street_name,
                address?.street_number,
                address?.zip_code
            ]

            const addressString = addressComponents.filter((c) => c !== null).join(', ');

            const phone = UniquePreference.payer?.phone

            const order = await prismadb.order.update({
                where: {
                    id: UniquePreference.id
                },
                data: {
                    isPaid: true,
                    address: addressString,
                    phone: `${phone?.area_code} ${phone?.number}` || ''
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

            return NextResponse.json({
                id: UniquePreference.id,
                userName: `${UniquePreference.payer?.name} ${UniquePreference.payer?.surname}`,
                address: `Rua ${UniquePreference.payer?.address?.street_name}, Número da rua ${UniquePreference.payer?.address?.street_number}, Código postal ${UniquePreference.payer?.address?.zip_code}`,
                value: UniquePayment.map(e => e.transaction_details?.total_paid_amount)[0]?.toString()
            }, { status: 200 })
        } else {
            return NextResponse.json('[PAYMENTS_POST]: Unauthorized: not paid yet', { status: 401 })
        }
    } else {
        return NextResponse.json('[PAYMENTS_POST]: Payment Not Found', { status: 404 })
    }

    } catch (error) {
        return NextResponse.json(`[PAYMENTS_POST]: ${error}`, { status: 500 })
    }
}