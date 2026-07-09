import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { IGetAllGearQuery } from "./gear.interface";

const getAllGearFromDB = async (query: IGetAllGearQuery) => {
    const {
        categoryId,
        brand,
        search,
        minPrice,
        maxPrice,
        page = "1",
        limit = "10",
    } = query;

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const where: Prisma.GearWhereInput = {
        status: "ACTIVE",
    };

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (brand) {
        where.brand = {
            equals: brand,
            mode: "insensitive",
        };
    }

    if (search) {
        where.name = {
            contains: search,
            mode: "insensitive",
        };
    }

    if (minPrice || maxPrice) {
        where.dailyRentalPrice = {};

        if (minPrice) {
            where.dailyRentalPrice.gte = new Prisma.Decimal(minPrice);
        }

        if (maxPrice) {
            where.dailyRentalPrice.lte = new Prisma.Decimal(maxPrice);
        }
    }

    const [gears, total] = await prisma.$transaction([
        prisma.gear.findMany({
            where,
            skip,
            take: pageSize,
            include: {
                category: true,
                provider: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.gear.count({
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
        data: gears,
    };
};

const getProviderGearFromDB = async (
    providerId: string,
    query: IGetAllGearQuery,
) => {
    const {
        categoryId,
        brand,
        search,
        minPrice,
        maxPrice,
        page = "1",
        limit = "10",
    } = query;

    const currentPage = Number(page);
    const pageSize = Number(limit);

    const where: Prisma.GearWhereInput = {
        providerId,
        status: "ACTIVE",
    };

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (brand) {
        where.brand = {
            contains: brand,
            mode: "insensitive",
        };
    }

    if (search) {
        where.name = {
            contains: search,
            mode: "insensitive",
        };
    }

    if (minPrice || maxPrice) {
        where.dailyRentalPrice = {};

        if (minPrice) {
            where.dailyRentalPrice.gte = new Prisma.Decimal(minPrice);
        }

        if (maxPrice) {
            where.dailyRentalPrice.lte = new Prisma.Decimal(maxPrice);
        }
    }

    const [gears, total] = await prisma.$transaction([
        prisma.gear.findMany({
            where,
            include: {
                category: true,
            },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: "desc",
            },
        }),
        prisma.gear.count({
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
        data: gears,
    };
};

const getGearDetailsFromDB = async (gearId: string) => {
    const gear = await prisma.gear.findUnique({
        where: {
            id: gearId,
        },
        include: {
            category: true,
            provider: {
                select: {
                    id: true,
                    name: true,
                    profile: {
                        select: {
                            profilePhoto: true,
                            bio: true,
                        },
                    },
                },
            },
        },
    });

    if (!gear) {
        throw new Error("Gear not found.");
    }

    return gear;
};

const getAllCategoriesFromDB = async () => {
    const categories = await prisma.category.findMany({
        orderBy: {
            name: "asc",
        },
    });

    return categories;
};

export const gearService = {
    getAllGearFromDB,
    getProviderGearFromDB,
    getGearDetailsFromDB,
    getAllCategoriesFromDB,
};
