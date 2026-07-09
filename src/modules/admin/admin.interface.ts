import { ActiveStatus } from "../../../generated/prisma/enums";

export interface ICreateCategoryPayload {
    name: string;
    description?: string;
}

export interface IGetUsersQuery {
    page?: string;
    limit?: string;
}

export interface IUpdateUserStatusPayload {
    activeStatus: ActiveStatus;
}

export interface IGetAllRentalOrdersQuery {
    page?: string;
    limit?: string;
}
