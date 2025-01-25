import { AppDataSource } from "../data-source";
import { RegionalDemand } from "../entity/RegionalDemand"; // Cambiar a la nueva entidad
import axios from "axios";
import { configDotenv } from "dotenv";
import { ExecutionLogService } from "./executionLogService";
import { Codes, parametersPerDay } from "../utils/settings";

configDotenv({ path: "variables.env" });

export class RegionalDemandService {
  private readonly apiUrl =
    process.env.API_URL_HOURLY || "https://servapibi.xm.com.co/hourly"; // URL de la API para demanda por región
  private readonly code = Codes.regionalDemand; // Código para la demanda por región
  private readonly executionLogService: ExecutionLogService;
  private readonly maxDays = parametersPerDay.maxDays; // Número máximo de días permitidos por la API
  private readonly safeDays = parametersPerDay.safeDays; // Número de días seguros para asegurar que la información está disponible

  constructor() {
    // Inicializar el atributo executionLogService en el constructor
    this.executionLogService = new ExecutionLogService();
}

  async checkAndUpdateRegionalDemand() {
    let lastUpdate = await this.executionLogService.getLastExecutionDate(this.code);
    const currentDate = new Date();
    const safeDate = new Date(currentDate);
    safeDate.setDate(currentDate.getDate() - this.safeDays); // Fecha segura

    if (lastUpdate < safeDate) {
      while (lastUpdate < safeDate) {
        let startDate = new Date(lastUpdate);
        let endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + this.maxDays - 1);

        if (endDate > safeDate) {
          endDate = safeDate;
        }

        await this.updateRegionalDemandData(startDate, endDate);
        lastUpdate.setTime(endDate.getTime() + 86400000); // Incrementar en 1 día
      }

      console.log("Actualización de demanda por región completada.");

      const regionalDemandRepository =
        AppDataSource.getRepository(RegionalDemand);
      await this.executionLogService.updateLastExecutionDate(this.code, regionalDemandRepository);
    } else {
      console.log(
        `Generacion real actualizada a fecha de hoy menos ${safeDate} dias`
      );
    }
  }

  private async updateRegionalDemandData(startDate: Date, endDate: Date) {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const requestBody = {
        MetricId: "DemaCome", // Demanda comercial por región
        StartDate: formattedStartDate,
        EndDate: formattedEndDate,
        Entity: "MercadoComercializacion",
      };

      const response = await axios.post(this.apiUrl, requestBody);
      const demandData = response.data.Items;

      const demandRepository = AppDataSource.getRepository(RegionalDemand);
      const promises: Promise<RegionalDemand>[] = [];

      for (const item of demandData) {
        const date = item.Date;

        for (const entity of item.HourlyEntities) {
          const hourlyValues = entity.Values;

          let totalDemand = 0;
          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `Hour${hour.toString().padStart(2, "0")}`;
            totalDemand += parseFloat(hourlyValues[hourKey]) || 0;
          }

          const code = hourlyValues.code;
          const marketType = hourlyValues.MarketType;

          const existingDemand = await demandRepository.findOne({
            where: { date, code, marketType },
          });

          if (!existingDemand) {
            const newDemand = demandRepository.create({
              date,
              code,
              marketType,
              totalDemand,
            });

            promises.push(demandRepository.save(newDemand));
          }
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.error(
        "Error al actualizar los datos de demanda por región:",
        error
      );
    }
  }
}
