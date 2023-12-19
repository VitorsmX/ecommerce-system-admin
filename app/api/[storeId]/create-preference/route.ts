import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { Product } from "@prisma/client";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid'
import { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { Items } from "mercadopago/dist/clients/commonTypes";

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN!, options: { timeout: 5000, idempotencyKey: uuidv4() } });

const preference = new Preference(client);

type ProductItem = {
    id: string;
    itemQuantity: number;
};

type ResponseBody = {
    productIds: ProductItem[];
};

export async function POST(
    req: Request,
    { params }: { params: { storeId: string } }
) {
    const response = await req.json() as ResponseBody;
    const { productIds } = response;

    // const { productIds: { id, itemQuantity } } = await req.json();

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
            description: true
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
            picture_url: "https://www.mercadopago.com/org-img/MP3/home/logomp3.gif",
            description: `O Produto de nome "${product.name}" está sendo comprado na quantidade de ${getProductQuantity(productIds, product.id)}`,
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

        const backEndBaseURL = `${process.env.NEXT_PUBLIC_API_URL}/payments/${preferenceResponse.payer?.identification?.number}/${preferenceResponse.id}`

        const responsePaymentUpdate = await fetch(`${backEndBaseURL}`)

        if(responsePaymentUpdate.status === 200) {
            return NextResponse.json({
                id: preferenceResponse.id
            });
        } else {
            return NextResponse.json({
                id: JSON.stringify(responsePaymentUpdate.json())   
            });
        }
    } catch (error) {
        console.log(error);
        return new NextResponse(`[PREFERENCES_POST] ${error}`, { status: 500 });
    }
}