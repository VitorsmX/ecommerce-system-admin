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

        const { name, price, categoryId, brandId, descriptionId, sizeId, images, isFeatured, isArchived } = body;

        if (!userId) {
            return new NextResponse("Unauthenticated", { status: 401 })
        }

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        if(!images || !images.length) {
            return new NextResponse("Images are required", { status: 400 })
        }

        if (!price) {
            return new NextResponse("Price is required", { status: 400 })
        }

        if (!categoryId) {
            return new NextResponse("Category id is required", { status: 400 })
        }
        
        if (!sizeId) {
            return new NextResponse("Size id is required", { status: 400 })
        }

        if (!brandId) {
            return new NextResponse("Brand id is required", { status: 400 })
        }

        if (!descriptionId) {
            return new NextResponse("Description id is required", { status: 400 })
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

        const product = await prismadb.product.create({
            data: {
                name,
                price,
                isFeatured,
                isArchived,
                categoryId,
                brandId,
                descriptionId,
                sizeId,
                storeId: params.storeId,
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: { url: string } ) => image)
                        ]
                    }
                }
            }
        })

        return NextResponse.json(product);
    } catch (error) {
        console.log('[PRODUCTS_POST]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET (
    req: Request,
    { params }: { params: { storeId: string } }
) {
    try {

        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") || undefined
        const brandId = searchParams.get("brandId") || undefined
        const descriptionId = searchParams.get("descriptionId") || undefined
        const sizeId = searchParams.get("sizeId") || undefined
        const isFeatured = searchParams.get("isFeatured")
        const isArchived = searchParams.get("isArchived")

        if (!params.storeId) {
            return new NextResponse("Store id is required", { status: 400 })
        }

        const products = await prismadb.product.findMany({
            where: {
                storeId: params.storeId,
                categoryId,
                brandId,
                descriptionId,
                sizeId,
                isFeatured: isFeatured ? true : undefined,
                isArchived: isArchived ? true : undefined
            },
            include: {
                images: true,
                category: true,
                brand: true,
                description: true,
                size: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.log('[PRODUCTS_GET]', error);
        return new NextResponse(`Internal error ${error}`, { status: 500 });
    }
}