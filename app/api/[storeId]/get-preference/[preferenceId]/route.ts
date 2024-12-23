import { NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { Product } from "@prisma/client";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { v4 as uuidv4 } from 'uuid'
import { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { Items } from "mercadopago/dist/clients/commonTypes";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, DELETE, PATCH, POST, PUT",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  
  export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
  }

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_SAMPLE_ACCESS_TOKEN!, options: { timeout: 5000, idempotencyKey: uuidv4() } });

const preference = new Preference(client);

export async function GET(
    req: Request,
    { params }: { params: { storeId: string, preferenceId: string } }
) {

    // const { productIds: { id, itemQuantity } } = await req.json();

    if (!params.preferenceId) {
        return new NextResponse("Preference id is required", { status: 400 });
    }

    try {
        const preferenceResponse = await preference.get({
            preferenceId: params.preferenceId,
        })

        if (preferenceResponse && preferenceResponse.items) {
            return NextResponse.json({
                id: preferenceResponse.id,
                productNames: `${preferenceResponse.items.map(e => e.title).join(", ")}` || " ",
            });
        } else {
            return NextResponse.json({
                id: preferenceResponse.id,
                productNames: "0",
            });
        }
    } catch (error) {
        console.log(error);
        return new NextResponse(`[PREFERENCES_POST] ${error}`, { status: 500 });
    }
}

