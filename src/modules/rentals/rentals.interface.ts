export interface IRentalItem {
    gearId: string;
    quantity: number;
}

export interface ICreateRentalOrderPayload {
    rentalStartDate: string;
    rentalEndDate: string;
    items: IRentalItem[];
    note?: string;
}

export interface IGetRentalOrdersQuery {
    page?: string;
    limit?: string;
}
