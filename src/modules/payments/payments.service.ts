import axios from "axios";
import { Prisma } from "../../../generated/prisma/client";
import {
    PaymentStatus,
    RentalOrderStatus,
} from "../../../generated/prisma/enums";
import config from "../../config/index";
import { prisma } from "../../lib/prisma";
import { IGetPaymentsQuery } from "./payments.interface";

const initiatePaymentIntoDB = async (
    customerId: string,
    rentalOrderId: string,
) => {
    const order = await prisma.rentalOrder.findFirst({
        where: {
            id: rentalOrderId,
            customerId,
        },
        include: {
            customer: true,
        },
    });

    if (!order) {
        throw new Error("Pending comfirm order not found.");
    }

    if (order.status !== RentalOrderStatus.CONFIRMED) {
        throw new Error("Payment can only be initiated for confirmed orders.");
    }

    const completedPayment = await prisma.payment.findFirst({
        where: {
            rentalOrderId,
            status: PaymentStatus.COMPLETED,
        },
    });

    if (completedPayment) {
        throw new Error("Payment already completed.");
    }

    // const pendingPayment = await prisma.payment.findFirst({
    //     where: {
    //         rentalOrderId,
    //         status: PaymentStatus.PENDING,
    //     },
    // });

    // if (pendingPayment) {
    //     throw new Error("Payment already in progress.");
    // }

    const tranId = crypto.randomUUID();

    const paymentData = {
        store_id: config.ssl_store_id,
        store_passwd: config.ssl_store_passwd,

        total_amount: Number(order.totalAmount),

        currency: "BDT",

        tran_id: tranId,

        success_url: `${config.app_url}/api/payments/confirm/success?tranId=${tranId}`,

        fail_url: `${config.app_url}/api/payments/confirm/fail?tranId=${tranId}`,

        cancel_url: `${config.app_url}/api/payments/confirm/cancel?tranId=${tranId}`,

        cus_name: order.customer.name,
        cus_email: order.customer.email,

        cus_add1: "N-A",
        cus_add2: "N-A",

        cus_city: "Dhaka",
        cus_state: "Dhaka",

        cus_postcode: "1207",

        cus_country: "Bangladesh",

        cus_phone: "01700000000",

        cus_fax: "01700000000",

        shipping_method: "NO",

        product_name: "Sports Gear Rental",

        product_category: "Rental",

        product_profile: "general",
    };

    const response = await axios.post(
        "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
        paymentData,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        },
    );

    // console.log("response", response.data);

    if (response.data.status !== "SUCCESS") {
        throw new Error("Failed to initialize payment.");
    }

    // console.log("response.data", response.data);

    await prisma.payment.create({
        data: {
            tranId,
            rentalOrderId: order.id,
            stripePaymentIntentId: tranId,
            amount: new Prisma.Decimal(order.totalAmount),
            currency: "BDT",
            status: PaymentStatus.PENDING,
        },
    });

    return {
        gatewayUrl: response.data.GatewayPageURL,
        tranId,
    };
};

const verifyPaymentIntoDB = async (
    tranId: string,
    status: string,
    payload: Record<string, any>,
) => {
    const payment = await prisma.payment.findUnique({
        where: {
            tranId,
        },
        include: {
            rentalOrder: {
                include: {
                    items: true,
                },
            },
        },
    });

    if (!payment) {
        throw new Error("Payment not found.");
    }

    if (status !== "success") {
        await prisma.payment.update({
            where: {
                tranId,
            },
            data: {
                status: PaymentStatus.FAILED,
                meta: payload as Prisma.InputJsonValue,
            },
        });

        throw new Error("Payment Failed");
    }

    const response = await axios.get(
        `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php`,
        {
            params: {
                val_id: payload.val_id,
                store_id: config.ssl_store_id,
                store_passwd: config.ssl_store_passwd,
                format: "json",
            },
        },
    );

    const data = response.data;

    if (data.status !== "VALID") {
        await prisma.payment.update({
            where: {
                tranId,
            },
            data: {
                status: PaymentStatus.FAILED,
                meta: data as Prisma.InputJsonValue,
            },
        });

        throw new Error("Payment validation failed.");
    }

    const result = await prisma.$transaction(async (tx) => {
        await tx.payment.update({
            where: {
                tranId,
            },
            data: {
                status: PaymentStatus.COMPLETED,
                paidAt: new Date(),
                meta: data as Prisma.InputJsonValue,
            },
        });

        await tx.rentalOrder.update({
            where: {
                id: payment.rentalOrderId,
                status: RentalOrderStatus.CONFIRMED,
            },
            data: {
                status: RentalOrderStatus.PAID,
            },
        });

        for (const item of payment.rentalOrder.items) {
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

        return tx.payment.findUnique({
            where: {
                tranId,
            },
        });
    });

    return result;
};

const validateTransactionByTranId = async (tranId: string) => {
    // const response = await axios.get(
    //     "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
    //     {
    //         params: {
    //             tran_id: tranId,
    //             store_id: config.ssl_store_id,
    //             store_passwd: config.ssl_store_passwd,
    //             format: "json",
    //         },
    //     },
    // );

    // return response.data;

    const payment = await prisma.payment.findUnique({
        where: {
            tranId,
        },
        include: {
            rentalOrder: {
                include: {
                    items: true,
                },
            },
        },
    });

    if (!payment) {
        throw new Error("Payment not found.");
    }

    // Already processed
    if (payment.status === PaymentStatus.COMPLETED) {
        return payment;
    }

    // Validate transaction from SSLCommerz
    const response = await axios.get(
        "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
        {
            params: {
                tran_id: tranId,
                store_id: config.ssl_store_id,
                store_passwd: config.ssl_store_passwd,
                format: "json",
            },
        },
    );

    const validationResponse = response.data;

    if (validationResponse.APIConnect !== "DONE") {
        throw new Error("Unable to connect with SSLCommerz validation server.");
    }

    if (
        !validationResponse.no_of_trans_found ||
        !validationResponse.element?.length
    ) {
        await prisma.payment.update({
            where: {
                tranId,
            },
            data: {
                status: PaymentStatus.FAILED,
                meta: validationResponse as Prisma.InputJsonValue,
            },
        });

        throw new Error("Transaction not found.");
    }

    const transaction = validationResponse.element[0];

    const isPaymentSuccessful =
        transaction.status === "VALID" || transaction.status === "VALIDATED";

    if (
        isPaymentSuccessful &&
        transaction.tran_id === payment.tranId &&
        Number(transaction.amount) === Number(payment.amount) &&
        transaction.currency.toUpperCase() === payment.currency.toUpperCase()
    ) {
        const result = await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: {
                    tranId,
                },
                data: {
                    status: PaymentStatus.COMPLETED,
                    paidAt: new Date(transaction.validated_on),
                    meta: validationResponse as Prisma.InputJsonValue,
                },
            });

            await tx.rentalOrder.update({
                where: {
                    id: payment.rentalOrderId,
                },
                data: {
                    status: RentalOrderStatus.PAID,
                },
            });

            for (const item of payment.rentalOrder.items) {
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

            return tx.payment.findUnique({
                where: {
                    tranId,
                },
            });
        });

        return result;
    }

    // console.log("transaction", transaction);

    if (transaction.status === "PROCESSING")
        throw new Error(`Transaction is in process`);

    await prisma.payment.update({
        where: {
            tranId,
        },
        data: {
            status: PaymentStatus.FAILED,
            meta: validationResponse as Prisma.InputJsonValue,
        },
    });

    throw new Error(`Payment verification failed. Callback Status`);
};

const getMyPaymentsFromDB = async (
    customerId: string,
    query: IGetPaymentsQuery,
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const whereCondition = {
        status: PaymentStatus.COMPLETED,
        rentalOrder: {
            customerId,
        },
    };

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                rentalOrder: {
                    select: {
                        id: true,
                        rentalStartDate: true,
                        rentalEndDate: true,
                        totalAmount: true,
                        status: true,
                    },
                },
            },
        }),

        prisma.payment.count({
            where: whereCondition,
        }),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: payments,
    };
};

const getPaymentDetailsFromDB = async (
    customerId: string,
    rentalOrderId: string,
) => {
    const rentalOrder = await prisma.rentalOrder.findFirst({
        where: {
            id: rentalOrderId,
            customerId,
        },
    });

    if (!rentalOrder) {
        throw new Error("Rental order not found.");
    }

    const payments = await prisma.payment.findMany({
        where: {
            rentalOrderId,
            status: PaymentStatus.COMPLETED,
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            tranId: true,
            amount: true,
            currency: true,
            status: true,
            paidAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return {
        rentalOrderId,
        totalAmount: rentalOrder.totalAmount,
        rentalStatus: rentalOrder.status,
        payments,
    };
};

export const paymentsService = {
    initiatePaymentIntoDB,
    verifyPaymentIntoDB,
    validateTransactionByTranId,
    getMyPaymentsFromDB,
    getPaymentDetailsFromDB,
};
