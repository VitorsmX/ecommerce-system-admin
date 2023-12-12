import Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import prismadb from "@/lib/prismadb";
import { Product } from "@prisma/client";

type ProductItem = {
    id: string;
    itemQuantity: number;
  };

type ResponseBody = {
    productIds: ProductItem[];
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(
    req: Request,
    { params }: { params: { storeId: string } }
) {
    const response = await req.json() as ResponseBody;
    const { productIds } = response;

    // const { productIds: { id, itemQuantity } } = await req.json();

    if(!productIds || productIds.length === 0 || !productIds.find(e => e.id)) {
        return new NextResponse("Product ids are required", { status: 400 });
    }

    if(!productIds.find(e => e.itemQuantity)) {
        return new NextResponse("Item quantity required", { status: 400 });
    }

    if (productIds.find(e => e.itemQuantity === 0)) {
        return new NextResponse("Item quantity must be different of zero", { status: 400 });
    }

    const products = await prismadb.product.findMany({
        where: {
            id: { 
                in: productIds.map(e => e.id)
             }
        }
    });

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    const getProductQuantity = (products: ProductItem[], productId: Product["id"] ) => {
        return products.filter(prod => prod.id === productId).map(productItem => productItem.itemQuantity)[0]
    }

    products.forEach((product) => {
        line_items.push({
            quantity: getProductQuantity(productIds, product.id),
            price_data: {
                currency: 'BRL',
                product_data: {
                    name: product.name,
                    description: `O Produto ${product.name} está sendo comprado na quantidade de ${getProductQuantity(productIds, product.id)}`
                },
                unit_amount: product.price.toNumber() * 100
            }
        });
    });

    const order = await prismadb.order.create({
        data: {
            storeId: params.storeId,
            isPaid: false,
            orderItems: {
                create: productIds.map((product) => ({
                    product: {
                        connect: {
                            id: product.id
                        }
                    },
                    orderQuantity: product.itemQuantity
                }))
            }
        }
    })

    const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        billing_address_collection: "required",
        phone_number_collection: {
            enabled: true
        },
        success_url: `${process.env.FRONTEND_STORE_URL}/cart?success=1`,
        cancel_url: `${process.env.FRONTEND_STORE_URL}/cart?canceled=1`,
        metadata: {
            orderId: order.id
        }
    });

    return NextResponse.json({ url: session.url }, {
        headers: corsHeaders
    })
}