import { AppDataSource } from "../data-source";
import { StockMarketPrice } from "../entity/StockMarketPrice";
import axios from "axios";
import { configDotenv } from "dotenv";
import {
  getLastExecutionDate,
  updateLastExecutionDate,
} from "../utils/executionLogUtil";
import { Codes, parametersPerDay } from "../utils/settings";

configDotenv({ path: "variables.env" });

export class StockMarketPriceService {
  private readonly apiUrl =
    process.env.API_URL_DAILY || "http://servapibi.xm.com.co/daily"; // URL de la API para precios de bolsa nacional
  private readonly code = Codes.stockMarketPrice; // Código para el precio de bolsa nacional
  private readonly maxDays = parametersPerDay.maxDays; // Número máximo de días permitidos por la API
  private readonly safeDays = parametersPerDay.safeDays; // Número de días seguros

  async checkAndUpdatePrice() {
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

        await this.updatePriceData(startDate, endDate);
        lastUpdate.setTime(endDate.getTime() + 86400000); // Incrementar en 1 día
      }

      console.log("Actualización de precios de bolsa nacional completada.");

      const priceRepository = AppDataSource.getRepository(StockMarketPrice);
      await updateLastExecutionDate(this.code, priceRepository);
    } else {
      console.log(`Generacion real actualizada a fecha de hoy menos ${safeDate} dias`);
    }
  }

  private async updatePriceData(startDate: Date, endDate: Date) {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const requestBody = {
        MetricId: "PPPrecBolsNaci", // Precio Bolsa Nacional Ponderado
        StartDate: formattedStartDate,
        EndDate: formattedEndDate,
        Entity: "Sistema",
      };

      const response = await axios.post(this.apiUrl, requestBody);
      const priceData = response.data.Items;

      const priceRepository = AppDataSource.getRepository(StockMarketPrice);
      const promises: Promise<StockMarketPrice>[] = [];

      for (const item of priceData) {
        const date = item.Date;

        for (const entity of item.DailyEntities) {
          const price = parseFloat(entity.Value);

          const existingPrice = await priceRepository.findOne({
            where: { date },
          });

          if (!existingPrice) {
            const newPrice = priceRepository.create({
              date,
              price,
            });

            promises.push(priceRepository.save(newPrice));
          }
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error al actualizar los datos de precios:", error);
    }
  }
}
