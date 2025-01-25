import { AppDataSource } from "../data-source";
import { MaxDemand } from "../entity/MaxDemand";
import axios from "axios";
import { configDotenv } from "dotenv";
import {
  getLastExecutionDate,
  updateLastExecutionDate,
} from "../utils/executionLogUtil";
import { Codes, parametersPerDay } from "../utils/settings";

configDotenv({ path: "variables.env" });

export class MaxDemandService {
  private readonly apiUrl =
    process.env.API_URL_DAILY || "http://servapibi.xm.com.co/daily"; // URL de la API para demanda máxima
  private readonly code = Codes.maxDemand; // Código para la demanda máxima
  private readonly maxDays = parametersPerDay.maxDays; // Número máximo de días permitidos por la API
  private readonly safeDays = parametersPerDay.safeDays; // Número de días seguros para asegurar que la información está disponible

  async checkAndUpdateMaxDemand() {
    let lastUpdate = await getLastExecutionDate(this.code);
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

        await this.updateMaxDemandData(startDate, endDate);
        lastUpdate.setTime(endDate.getTime() + 86400000); // Incrementar en 1 día
      }

      console.log("Actualización de demanda máxima completada.");

      const maxDemandRepository = AppDataSource.getRepository(MaxDemand);
      await updateLastExecutionDate(this.code, maxDemandRepository);
    } else {
      console.log(`Generacion real actualizada a fecha de hoy menos ${safeDate} dias`);
    }
  }

  private async updateMaxDemandData(startDate: Date, endDate: Date) {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const requestBody = {
        MetricId: "DemaMaxPot", // Demanda máxima de potencia
        StartDate: formattedStartDate,
        EndDate: formattedEndDate,
        Entity: "Sistema",
      };

      const response = await axios.post(this.apiUrl, requestBody);
      const demandData = response.data.Items;

      const demandRepository = AppDataSource.getRepository(MaxDemand);
      const promises: Promise<MaxDemand>[] = [];

      for (const item of demandData) {
        const date = item.Date;

        for (const entity of item.DailyEntities) {
          const maxDemand = parseFloat(entity.Value);

          const existingDemand = await demandRepository.findOne({
            where: { date },
          });

          if (!existingDemand) {
            const newDemand = demandRepository.create({
              date,
              maxDemand,
            });

            promises.push(demandRepository.save(newDemand));
          }
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error al actualizar los datos de demanda máxima:", error);
    }
  }
}
