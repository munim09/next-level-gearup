import { prisma } from "../src/lib/prisma";

async function main() {
    await prisma.$connect();
    // --- Users -----------------------------------------------------------
    const admin = await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin@example.com",
            password: "123456",
            role: "ADMIN",
        },
    });

    const provider = await prisma.user.create({
        data: {
            name: "Rafiq Rahman",
            email: "provider@example.com",
            password: "123456",
            role: "PROVIDER",
            profile: {
                create: {
                    bio: "Camping and outdoor gear provider based in Dhaka.",
                },
            },
        },
    });

    const customer = await prisma.user.create({
        data: {
            name: "Cutomers",
            email: "customer@example.com",
            password: "123456",
            role: "CUSTOMER",
            profile: {
                create: {
                    bio: "Weekend hiker.",
                },
            },
        },
    });

    // --- Category ----------------------------------------------------------
    const category = await prisma.category.create({
        data: {
            name: "Camping",
            description: "Tents, sleeping bags, and camping accessories.",
        },
    });

    // --- Gear ----------------------------------------------------------------
    const gear = await prisma.gear.create({
        data: {
            providerId: provider.id,
            categoryId: category.id,
            name: "4-Person Tent",
            description: "Waterproof 4-person camping tent.",
            brand: "Coleman",
            model: "Sundome",
            dailyRentalPrice: 350.0,
            stockQuantity: 5,
        },
    });

    // --- Rental order + item --------------------------------------------------
    const rentalOrder = await prisma.rentalOrder.create({
        data: {
            customerId: customer.id,
            providerId: provider.id,
            rentalStartDate: new Date("2026-07-15"),
            rentalEndDate: new Date("2026-07-18"),
            totalAmount: 1050.0,
            status: "CONFIRMED",
            items: {
                create: [
                    {
                        gearId: gear.id,
                        quantity: 1,
                        dailyRentalPrice: 350.0,
                    },
                ],
            },
        },
    });

    // --- Payment -------------------------------------------------------------
    await prisma.payment.create({
        data: {
            tranId: "TRAN-0001",
            rentalOrderId: rentalOrder.id,
            stripePaymentIntentId: "pi_test_0001",
            amount: 1050.0,
            status: "COMPLETED",
            paidAt: new Date(),
        },
    });

    // --- Review ----------------------------------------------------------------
    await prisma.review.create({
        data: {
            customerId: customer.id,
            gearId: gear.id,
            rating: 5,
            comment: "Great tent, stayed dry through heavy rain.",
        },
    });

    console.log("Seed data created:", {
        admin: admin.email,
        provider: provider.email,
        customer: customer.email,
        category: category.name,
        categoryId: category.id,
        gear: gear.name,
        rentalOrder: rentalOrder.id,
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
