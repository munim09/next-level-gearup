import { Prisma } from "../../../generated/prisma/client";
import { RentalOrderStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
    ICreateRentalOrderPayload,
    IGetRentalOrdersQuery,
} from "./rentals.interface";

const createRentalOrderIntoDB = async (
    customerId: string,
    payload: ICreateRentalOrderPayload,
) => {
    const customer = await prisma.user.findUnique({
        where: {
            id: customerId,
        },
    });

    if (!customer) {
        throw new Error("Customer not found.");
    }

    if (customer.role !== Role.CUSTOMER) {
        throw new Error("Only customers can place rental orders.");
    }

    if (!payload.items.length) {
        throw new Error("At least one gear item is required.");
    }

    const rentalStartDate = new Date(payload.rentalStartDate);
    const rentalEndDate = new Date(payload.rentalEndDate);

    if (rentalEndDate < rentalStartDate) {
        throw new Error(
            "Rental end date must be greater than rental start date.",
        );
    }

    const startDateOnly = new Date(
        rentalStartDate.getFullYear(),
        rentalStartDate.getMonth(),
        rentalStartDate.getDate(),
    );

    const endDateOnly = new Date(
        rentalEndDate.getFullYear(),
        rentalEndDate.getMonth(),
        rentalEndDate.getDate(),
    );

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const rentalDays =
        (endDateOnly.getTime() - startDateOnly.getTime()) / millisecondsPerDay +
        1;

    // const rentalDays = Math.ceil(
    //     (rentalEndDate.getTime() - rentalStartDate.getTime()) /
    //         (1000 * 60 * 60 * 24),
    // );

    const gearIds = payload.items.map((item) => item.gearId);

    const gears = await prisma.gear.findMany({
        where: {
            id: {
                in: gearIds,
            },
            status: "ACTIVE",
        },
    });

    if (gears.length !== gearIds.length) {
        throw new Error("One or more gear items not found.");
    }

    // Ensure all gears belong to the same provider
    const providerId = gears[0]?.providerId;

    if (!providerId) {
        throw new Error("Provider not found.");
    }

    if (gears.some((gear) => gear.providerId !== providerId)) {
        throw new Error(
            "All selected gear items must belong to the same provider.",
        );
    }

    let totalAmount = 0;

    const orderItemsData = payload.items.map((item) => {
        const gear = gears.find((g) => g.id === item.gearId);

        if (!gear) {
            throw new Error(`Gear with id ${item.gearId} not found.`);
        }

        if (item.quantity <= 0) {
            throw new Error("Quantity must be greater than zero.");
        }

        if (gear.stockQuantity < item.quantity) {
            throw new Error(
                `${gear.name} has only ${gear.stockQuantity} item(s) available.`,
            );
        }

        const lineTotal =
            Number(gear.dailyRentalPrice) * item.quantity * rentalDays;

        totalAmount += lineTotal;

        return {
            gearId: gear.id,
            quantity: item.quantity,
            dailyRentalPrice: gear.dailyRentalPrice,
        };
    });

    const order = await prisma.$transaction(async (tx) => {
        // Create rental order
        const createdOrder = await tx.rentalOrder.create({
            data: {
                customerId,
                providerId,
                rentalStartDate,
                rentalEndDate,
                totalAmount: new Prisma.Decimal(totalAmount),
                status: RentalOrderStatus.PLACED,
                note: payload.note,

                items: {
                    create: orderItemsData.map((item) => ({
                        gearId: item.gearId,
                        quantity: item.quantity,
                        dailyRentalPrice: item.dailyRentalPrice,
                    })),
                },
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
                        gear: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            },
        });

        // Reduce stock
        for (const item of payload.items) {
            await tx.gear.update({
                where: {
                    id: item.gearId,
                },
                data: {
                    stockQuantity: {
                        decrement: item.quantity,
                    },
                },
            });
        }

        return createdOrder;
    });

    return order;
};

const getRentalOrderDetailsFromDB = async (
    customerId: string,
    rentalOrderId: string,
) => {
    const order = await prisma.rentalOrder.findFirst({
        where: {
            id: rentalOrderId,
            customerId,
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
                    profile: {
                        select: {
                            profilePhoto: true,
                            bio: true,
                        },
                    },
                },
            },
            items: {
                include: {
                    gear: {
                        include: {
                            category: true,
                        },
                    },
                },
            },
        },
    });

    if (!order) {
        throw new Error("Rental order not found.");
    }

    return order;
};

const getMyRentalOrdersFromDB = async (
    customerId: string,
    query: IGetRentalOrdersQuery,
) => {
    const { page = "1", limit = "10" } = query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const where: Prisma.RentalOrderWhereInput = {
        customerId,
    };

    const [orders, total] = await prisma.$transaction([
        prisma.rentalOrder.findMany({
            where,
            include: {
                provider: {
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

export const rentalService = {
    createRentalOrderIntoDB,
    getRentalOrderDetailsFromDB,
    getMyRentalOrdersFromDB,
};
