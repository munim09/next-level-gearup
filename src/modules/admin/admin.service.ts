import { Prisma, Role } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
    ICreateCategoryPayload,
    IGetAllRentalOrdersQuery,
    IGetUsersQuery,
    IUpdateUserStatusPayload,
} from "./admin.interface";

const createCategoryIntoDB = async (payload: ICreateCategoryPayload) => {
    const existingCategory = await prisma.category.findUnique({
        where: {
            name: payload.name,
        },
    });

    if (existingCategory) {
        throw new Error("Category already exists.");
    }

    const category = await prisma.category.create({
        data: {
            name: payload.name,
            description: payload.description,
        },
    });

    return category;
};

const getAllUsersFromDB = async (query: IGetUsersQuery) => {
    const { page = "1", limit = "10" } = query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const where: Prisma.UserWhereInput = {};

    const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            include: {
                profile: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        }),

        prisma.user.count({
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
        data: users,
    };
};

const updateUserStatusIntoDB = async (
    userId: string,
    payload: IUpdateUserStatusPayload,
) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new Error("User not found.");
    }

    if (user.role === Role.ADMIN) {
        throw new Error("Admin account status cannot be updated.");
    }

    if (user.activeStatus === payload.activeStatus) {
        throw new Error(
            `User is already ${payload.activeStatus.toLowerCase()}.`,
        );
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            activeStatus: payload.activeStatus,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            activeStatus: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return updatedUser;
};

const getAllRentalOrdersFromDB = async (query: IGetAllRentalOrdersQuery) => {
    const { page = "1", limit = "10" } = query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const [orders, total] = await prisma.$transaction([
        prisma.rentalOrder.findMany({
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
                            select: {
                                id: true,
                                name: true,
                                brand: true,
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

        prisma.rentalOrder.count(),
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

export const adminService = {
    createCategoryIntoDB,
    getAllUsersFromDB,
    updateUserStatusIntoDB,
    getAllRentalOrdersFromDB,
};
