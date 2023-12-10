import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function POST (
    req: Request,
    { params }: { params: { storeId: string } }
) {
    try {
        const { userId } = auth();
        const body = await req.json()

        const { description } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!description) {
            return new NextResponse("Description is required", { status: 400 })
        }

        if (!params.storeId) {
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

        const descriptions = await prismadb.description.create({
            data: {
                description,
                storeId: params.storeId
            }
        })

        return NextResponse.json(descriptions);
    } catch (error) {
        console.log('[DESCRIPTIONS_POST]', error);
        return new NextResponse(`Internal error ${error}`, { status: 500 });
    }
}

export async function GET (
    req: Request,
    { params }: { params: { storeId: string } }
) {
    try {
        if (!params.storeId) {
            return new NextResponse("Store id is required", { status: 400 })
        }

        const descriptions = await prismadb.description.findMany({
            where: {
                storeId: params.storeId,
            },
        });

        return NextResponse.json(descriptions);
    } catch (error) {
        console.log('[DESCRIPTIONS_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}