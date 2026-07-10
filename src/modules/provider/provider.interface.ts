import { RentalOrderStatus } from "../../../generated/prisma/enums";

export interface ICreateGearPayload {
    categoryId: string;
    name: string;
    description?: string;
    brand?: string;
    model?: string;
    imageUrl?: string;
    dailyRentalPrice: number;
    stockQuantity: number;
}

export interface IGetProviderOrdersQuery {
    page?: string;
    limit?: string;
}

export interface IUpdateRentalOrderStatusPayload {
    status: RentalOrderStatus;
}

export interface IUpdateGearStockPayload {
    stockQuantity: number;
}
