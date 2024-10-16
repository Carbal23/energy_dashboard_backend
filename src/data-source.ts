import "reflect-metadata"
import { DataSource } from "typeorm"
import { Resource } from "./entity/Resource"
import { configDotenv } from "dotenv";
import { RealGeneration } from "./entity/RealGeneration";
import { RealAvailability } from "./entity/RealAvailability";
import { ExecutionLog } from "./entity/ExecutionLog";
import { TotalDemand } from "./entity/TotalDemand";
import { RegionalDemand } from "./entity/RegionalDemand";
import { MaxDemand } from "./entity/MaxDemand";

configDotenv({path: 'variables.env'});

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.PG_HOST || "localhost",
    port: 5432,
    username: process.env.PG_USER || "postgres",
    password: process.env.PG_PASSWORD || "CAM2018",
    database: process.env.PG_DB || "energia_Col_DB",
    synchronize: true,
    logging: false,
    entities: [Resource, RealGeneration, RealAvailability, ExecutionLog, TotalDemand, RegionalDemand, MaxDemand],
    migrations: [],
    subscribers: [],
})
