import { RentalOrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreateReviewPayload } from "./review.interface";

const createReviewIntoDB = async (
    customerId: string,
    gearId: string,
    payload: ICreateReviewPayload,
) => {
    if (payload.rating < 1 || payload.rating > 5) {
        throw new Error("Rating must be between 1 and 5.");
    }

    const rentalItem = await prisma.rentalOrderItem.findFirst({
        where: {
            gearId,
            rentalOrder: {
                customerId,
                status: RentalOrderStatus.RETURNED,
            },
        },
        include: {
            rentalOrder: true,
            gear: true,
        },
    });

    if (!rentalItem) {
        throw new Error(
            "You can only review gear that you have rented and returned.",
        );
    }

    const existingReview = await prisma.review.findUnique({
        where: {
            customerId_gearId: {
                customerId,
                gearId,
            },
        },
    });

    if (existingReview) {
        throw new Error("You have already reviewed this gear.");
    }

    const review = await prisma.review.create({
        data: {
            customerId,
            gearId,
            rating: payload.rating,
            comment: payload.comment,
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                },
            },
            gear: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                },
            },
        },
    });

    return review;
};

const getGearReviewsFromDB = async (gearId: string) => {
    const gear = await prisma.gear.findUnique({
        where: {
            id: gearId,
        },
        select: {
            id: true,
            name: true,
            imageUrl: true,
        },
    });

    if (!gear) {
        throw new Error("Gear not found.");
    }

    const reviews = await prisma.review.findMany({
        where: {
            gearId,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            customer: {
                select: {
                    id: true,
                    name: true,
                    profile: {
                        select: {
                            profilePhoto: true,
                        },
                    },
                },
            },
        },
    });

    const totalReviews = reviews.length;

    const averageRating =
        totalReviews > 0
            ? Number(
                  (
                      reviews.reduce((sum, review) => sum + review.rating, 0) /
                      totalReviews
                  ).toFixed(1),
              )
            : 0;

    return {
        gear,
        averageRating,
        totalReviews,
        reviews,
    };
};

export const reviewService = { createReviewIntoDB, getGearReviewsFromDB };
