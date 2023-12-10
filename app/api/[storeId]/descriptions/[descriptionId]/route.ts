import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET (
    req: Request,
    { params }:
        {
            params:
            {
                descriptionId: string
            }
        }
) {
    try {

        if (!params.descriptionId) {
            return new NextResponse("Description id is required", { status: 400 })
        }

        const description = await prismadb.description.findUnique({
            where: {
                id: params.descriptionId,
            },
        });

        return NextResponse.json(description);

    } catch (error) {
        console.log('[DESCRIPTION_GET]', error);
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function PATCH (
    req: Request,
    { params }:
        {
            params:
            {
                storeId: string,
                descriptionId: string
            }
        }
) {
    try {
        const { userId } = auth();
        const body = await req.json();

        const { description } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!description) {
            return new NextResponse("Description is required", { status: 400 })
        }

        if (!params.descriptionId) {
            return new NextResponse("Description id is required", { status: 400 })
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

        const descriptionUnique = await prismadb.description.updateMany({
            where: {
                id: params.descriptionId,
            },
            data: {
                description
            }
        });

        return NextResponse.json(descriptionUnique);

    } catch (error) {
        console.log('[DESCRIPTION_PATCH]', error);
        return new NextResponse("Internal error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }:
        {
            params:
            {
                storeId: string,
                descriptionId: string
            }
        }
) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!params.descriptionId) {
            return new NextResponse("Description id is required", { status: 400 })
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

        const description = await prismadb.description.deleteMany({
            where: {
                id: params.descriptionId,
            },
        });

        return NextResponse.json(description);

    } catch (error) {
        console.log('[DESCRIPTION_DELETE]', error);
        return new NextResponse("Internal error", { status: 500 })
    }
}