import axios from "axios";
import { Prisma } from "../../../generated/prisma/client";
import {
    PaymentStatus,
    RentalOrderStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";

// const initiatePayment = async (userId: string, orderId: String) => {
//     const tranId = `TRNX_ID_${Date.now()}`;

//     const paymentData = {
//         store_id: "",
//         store_passwd: "",
//         total_amount: order.totalPrice,
//         currency: "BDT",
//         tran_id: tranId,
//         success_url: `${config.app_url}/api/payment?orderId=${order.id}&tranId=${tranId}&status=success`,
//         fail_url: `${config.app_url}/api/payment?orderId=${order.id}&tranId=${tranId}&status=fail`,
//         cancel_url: `${config.app_url}/api/payment?orderId=${order.id}&tranId=${tranId}&status=cancel`,
//         cus_name: user.name,
//         cus_email: user.email,
//         cus_add1: "N/A",
//         cus_add2: "N/A",
//         cus_city: "N/A",
//         cus_state: "N/A",
//         cus_postcode: 1000,
//         cus_country: "Bangladesh",
//         cus_phone: "01711111111",
//         cus_fax: "01711111111",
//     };

//     const response = await axios.post(
//         "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
//         paymentData,
//         {
//             headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         },
//     );
// };

const initiatePaymentIntoDB = async (
    customerId: string,
    rentalOrderId: string,
) => {
    const order = await prisma.rentalOrder.findFirst({
        where: {
            id: rentalOrderId,
            customerId,
            status: RentalOrderStatus.CONFIRMED,
        },
        include: {
            customer: true,
        },
    });

    if (!order) {
        throw new Error("Rental order not found.");
    }

    if (order.status !== RentalOrderStatus.CONFIRMED) {
        throw new Error("Payment can only be initiated for confirmed orders.");
    }

    // const completedPayment = await prisma.payment.findFirst({
    //     where: {
    //         rentalOrderId,
    //         status: PaymentStatus.COMPLETED,
    //     },
    // });

    // if (completedPayment) {
    //     throw new Error("Payment already completed.");
    // }

    const tranId = crypto.randomUUID();

    const paymentData = {
        store_id: "abc6a510484eae18",
        store_passwd: "abc6a510484eae18@ssl",

        total_amount: Number(order.totalAmount),

        currency: "BDT",

        tran_id: tranId,

        success_url: `${config.app_url}:${config.port}/api/payments/verify/success?tranId=${tranId}`,

        fail_url: `${config.app_url}:${config.port}/api/payments/verify/fail?tranId=${tranId}`,

        cancel_url: `${config.app_url}:${config.port}/api/payments/verify/cancel?tranId=${tranId}`,

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

    console.log("response.data", response.data);

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
                store_id: "abc6a510484eae18",
                store_passwd: "abc6a510484eae18@ssl",
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
    const response = await axios.get(
        "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
        {
            params: {
                tran_id: tranId,
                store_id: "abc6a510484eae18",
                store_passwd: "abc6a510484eae18@ssl",
                format: "json",
            },
        },
    );

    return response.data;
};

export const paymentsService = {
    initiatePaymentIntoDB,
    verifyPaymentIntoDB,
    validateTransactionByTranId,
};
