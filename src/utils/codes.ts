interface Icodes {
    resource: string;
    generation: string;
    availability: string;
    totalDemand: string;
    regionalDemand: string;
    maxDemand: string;
}

interface IparametersPerDay {
    maxDays: number;
    safeDays: number;
}

export const codes: Icodes = {
    resource: "RESO",
    generation: "GENE",
    availability: "AVAI",
    totalDemand: "TDEM",
    regionalDemand: "REDE",
    maxDemand: "MADE"
}

export const parametersPerDay: IparametersPerDay = {
    maxDays: 31,
    safeDays: 7,
}