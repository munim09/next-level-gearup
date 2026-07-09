import { Prisma } from "../../../generated/prisma/client";
import { RentalOrderStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
    ICreateGearPayload,
    IGetProviderOrdersQuery,
    IUpdateRentalOrderStatusPayload,
} from "../provider/provider.interface";

const addGearToInventory = async (
    providerId: string,
    payload: ICreateGearPayload,
) => {
    const provider = await prisma.user.findUnique({
        where: {
            id: providerId,
        },
    });

    if (!provider) {
        throw new Error("Provider not found.");
    }

    if (provider.role !== Role.PROVIDER) {
        throw new Error("Only providers can add gear.");
    }

    const category = await prisma.category.findUnique({
        where: {
            id: payload.categoryId,
        },
    });

    if (!category) {
        throw new Error("Category not found.");
    }

    const gear = await prisma.gear.create({
        data: {
            providerId,
            categoryId: payload.categoryId,
            name: payload.name,
            description: payload.description,
            brand: payload.brand,
            model: payload.model,
            imageUrl: payload.imageUrl,
            dailyRentalPrice: payload.dailyRentalPrice,
            stockQuantity: payload.stockQuantity,
        },
        include: {
            category: true,
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return gear;
};

const updateGearListing = async (
    providerId: string,
    gearId: string,
    payload: ICreateGearPayload,
) => {
    const provider = await prisma.user.findUnique({
        where: {
            id: providerId,
        },
    });

    if (!provider) {
        throw new Error("Provider not found.");
    }

    if (provider.role !== Role.PROVIDER) {
        throw new Error("Only providers can update gear.");
    }

    const existingGear = await prisma.gear.findUnique({
        where: {
            id: gearId,
        },
    });

    if (!existingGear) {
        throw new Error("Gear not found.");
    }

    if (existingGear.providerId !== providerId) {
        throw new Error("You are not authorized to update this gear.");
    }

    if (payload.categoryId) {
        const category = await prisma.category.findUnique({
            where: {
                id: payload.categoryId,
            },
        });

        if (!category) {
            throw new Error("Category not found.");
        }
    }

    const updatedGear = await prisma.gear.update({
        where: {
            id: gearId,
            providerId,
        },
        data: {
            ...payload,
        },
        include: {
            category: true,
            provider: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    return updatedGear;
};

const removeGearFromInventory = async (providerId: string, gearId: string) => {
    const provider = await prisma.user.findUnique({
        where: {
            id: providerId,
        },
    });

    if (!provider) {
        throw new Error("Provider not found.");
    }

    if (provider.role !== Role.PROVIDER) {
        throw new Error("Only providers can remove gear.");
    }

    const existingGear = await prisma.gear.findUnique({
        where: {
            id: gearId,
        },
    });

    if (!existingGear) {
        throw new Error("Gear not found.");
    }

    if (existingGear.providerId !== providerId) {
        throw new Error("You are not authorized to remove this gear.");
    }

    await prisma.gear.delete({
        where: {
            id: gearId,
        },
    });

    return null;
};

const getProviderOrdersFromDB = async (
    providerId: string,
    query: IGetProviderOrdersQuery,
) => {
    const { page = "1", limit = "10" } = query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const where: Prisma.RentalOrderWhereInput = {
        providerId,
    };

    const [orders, total] = await prisma.$transaction([
        prisma.rentalOrder.findMany({
            where,
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        gear: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                                brand: true,
                                model: true,
                                dailyRentalPrice: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        }),

        prisma.rentalOrder.count({
            where,
        }),
    ]);

    return {
        meta: {
            page: currentPage,
            limit: pageSize,
            total,
            totalPage: Math.ceil(total / pageSize),
        },
        data: orders,
    };
};

const updateRentalOrderStatusIntoDB = async (
    providerId: string,
    orderId: string,
    payload: IUpdateRentalOrderStatusPayload,
) => {
    const order = await prisma.rentalOrder.findFirst({
        where: {
            id: orderId,
            providerId,
        },
        include: {
            items: true,
        },
    });

    if (!order) {
        throw new Error("Rental order not found.");
    }

    const currentStatus = order.status;
    const nextStatus = payload.status;

    switch (currentStatus) {
        case RentalOrderStatus.PLACED:
            if (
                nextStatus !== RentalOrderStatus.CONFIRMED &&
                nextStatus !== RentalOrderStatus.CANCELLED
            ) {
                throw new Error(
                    "A placed order can only be confirmed or cancelled.",
                );
            }
            break;

        case RentalOrderStatus.CONFIRMED:
            throw new Error(
                "Provider cannot update a confirmed order. Waiting for payment.",
            );

        case RentalOrderStatus.PAID:
            if (nextStatus !== RentalOrderStatus.PICKED_UP) {
                throw new Error(
                    "A paid order can only be marked as picked up.",
                );
            }
            break;

        case RentalOrderStatus.PICKED_UP:
            if (nextStatus !== RentalOrderStatus.RETURNED) {
                throw new Error(
                    "A picked up order can only be marked as returned.",
                );
            }
            break;

        case RentalOrderStatus.RETURNED:
            throw new Error("This rental order has already been returned.");

        case RentalOrderStatus.CANCELLED:
            throw new Error("Cancelled orders cannot be updated.");

        default:
            throw new Error("Invalid rental order status.");
    }

    // const updatedOrder = await prisma.rentalOrder.update({
    //     where: {
    //         id: orderId,
    //     },
    //     data: {
    //         status: nextStatus,
    //     },
    //     include: {
    //         customer: {
    //             select: {
    //                 id: true,
    //                 name: true,
    //                 email: true,
    //             },
    //         },
    //         provider: {
    //             select: {
    //                 id: true,
    //                 name: true,
    //                 email: true,
    //             },
    //         },
    //         items: {
    //             include: {
    //                 gear: true,
    //             },
    //         },
    //     },
    // });

    const updatedOrder = await prisma.$transaction(async (tx) => {
        // Increase stock only when gear is returned
        if (
            nextStatus === RentalOrderStatus.RETURNED ||
            nextStatus === RentalOrderStatus.CANCELLED
        ) {
            for (const item of order.items) {
                await tx.gear.update({
                    where: {
                        id: item.gearId,
                    },
                    data: {
                        stockQuantity: {
                            increment: item.quantity,
                        },
                    },
                });
            }
        }

        return tx.rentalOrder.update({
            where: {
                id: orderId,
            },
            data: {
                status: nextStatus,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                provider: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        gear: true,
                    },
                },
            },
        });
    });

    return updatedOrder;
};

export const providerService = {
    addGearToInventory,
    updateGearListing,
    removeGearFromInventory,
    getProviderOrdersFromDB,
    updateRentalOrderStatusIntoDB,
};
