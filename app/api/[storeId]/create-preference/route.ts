import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { Product } from "@prisma/client";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid'
import { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { Items } from "mercadopago/dist/clients/commonTypes";
import axios from "axios";

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN!, options: { timeout: 5000, idempotencyKey: uuidv4() } });

const preference = new Preference(client);

type ProductItem = {
    id: string;
    itemQuantity: number;
};

type ResponseBody = {
    productIds: ProductItem[];
};

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
    { params }: { params: { storeId: string } }
) {
    const response = await req.json() as ResponseBody;
    const { productIds } = response;

    // const { productIds: { id, itemQuantity } } = await req.json();

    const BackEndURL = process.env.NEXT_PUBLIC_API_URL!

    if (!productIds || productIds.length === 0 || !productIds.find(e => e.id)) {
        return new NextResponse("Product ids are required", { status: 400 });
    }

    if (!productIds.find(e => e.itemQuantity)) {
        return new NextResponse("Item quantity required", { status: 400 });
    }

    if (productIds.find(e => e.itemQuantity === 0)) {
        return new NextResponse("Item quantity must be different of zero", { status: 400 });
    }

    const products = await prismadb.product.findMany({
        where: {
            id: {
                in: productIds.map(e => e.id),
            }
        },
        include: {
            description: true,
            images: true
        }
    });

    let items: Items[] = []

    const getProductQuantity = (products: ProductItem[], productId: Product["id"]) => {
        return products.filter(prod => prod.id === productId).map(productItem => productItem.itemQuantity)[0]
    }

    products.forEach((product) => {
        items.push({
            id: product.id,
            title: product.name,
            currency_id: "BRL",
            picture_url: product.images[0].url,
            description: `${product.name}: ${getProductQuantity(productIds, product.id)}`,
            category_id: product.categoryId,
            quantity: getProductQuantity(productIds, product.id),
            unit_price: parseFloat(product.price.toString())
        })
    });

    const successURL = `${process.env.FRONTEND_STORE_URL!}/cart/${params.storeId}/success`
    const failureURL = `${process.env.FRONTEND_STORE_URL!}/cart/${params.storeId}/failure`

    const body: PreferenceRequest = {
        items,
        auto_return: 'approved',
        payment_methods: {
            excluded_payment_methods: [],
            excluded_payment_types: [],
            installments: 12
        },
        back_urls: {
            success: `${successURL}`,
            failure: `${failureURL}`
        }
    };

    try {
        const preferenceResponse = await preference.create({ body })

        await prismadb.order.create({
            data: {
                id: preferenceResponse.id,
                storeId: params.storeId,
                preferenceId: preferenceResponse.id || "",
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

        const updatedPreference = await preference.update({
            id: preferenceResponse.id as string,
            updatePreferenceRequest: {
                notification_url: `${BackEndURL}/mercado-pago-payment/${preferenceResponse.id}`,
                items: items
            }
        })

        return NextResponse.json({
            id: updatedPreference.id
        });
    } catch (error) {
        console.log(error);
        return new NextResponse(`[PREFERENCES_POST] ${error}`, { status: 500 });
    }
}

