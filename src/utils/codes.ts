export enum Codes {
    resource = "RESO",
    generation = "GENE",
    availability = "AVAI",
    totalDemand = "TDEM",
    regionalDemand = "REDE",
    maxDemand = "MADE",
    stockMarketPrice = "SMPR",
    maxOfferPrice = "MOPR"
}

interface IparametersPerDay {
    maxDays: number;
    safeDays: number;
}


export const parametersPerDay: IparametersPerDay = {
    maxDays: 31,
    safeDays: 7,
}