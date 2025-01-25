import { AppDataSource } from "../data-source";
import { MaxOfferPrice } from "../entity/MaxOfferPrice";
import axios from "axios";
import { configDotenv } from "dotenv";
import { ExecutionLogService } from "./executionLogService";
import { Codes, parametersPerDay } from "../utils/settings";

configDotenv({ path: "variables.env" });

export class MaxOfferPriceService {
  private readonly apiUrl =
    process.env.API_URL_HOURLY || "http://servapibi.xm.com.co/hourly"; // URL de la API para máximos precios de oferta
  private readonly code = Codes.maxOfferPrice; // Código para el máximo precio de oferta
  private readonly executionLogService: ExecutionLogService;
  private readonly maxDays = parametersPerDay.maxDays; // Número máximo de días permitidos por la API
  private readonly safeDays = parametersPerDay.safeDays; // Número de días seguros

  constructor() {
    // Inicializar el atributo executionLogService en el constructor
    this.executionLogService = new ExecutionLogService();
}

  async checkAndUpdateMaxOfferPrice() {
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

        await this.updateMaxOfferPriceData(startDate, endDate);
        lastUpdate.setTime(endDate.getTime() + 86400000); // Incrementar en 1 día
      }

      console.log("Actualización de máximo precio de oferta completada.");

      const maxOfferPriceRepository =
        AppDataSource.getRepository(MaxOfferPrice);
      await this.executionLogService.updateLastExecutionDate(this.code, maxOfferPriceRepository);
    } else {
      console.log(
        `Generacion real actualizada a fecha de hoy menos ${safeDate} dias`
      );
    }
  }

  private async updateMaxOfferPriceData(startDate: Date, endDate: Date) {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const requestBody = {
        MetricId: "MaxPrecOferNal", // Máximo Precio de Oferta Nacional
        StartDate: formattedStartDate,
        EndDate: formattedEndDate,
        Entity: "Sistema",
      };

      const response = await axios.post(this.apiUrl, requestBody);
      const priceData = response.data.Items;

      const maxOfferPriceRepository =
        AppDataSource.getRepository(MaxOfferPrice);
      const promises: Promise<MaxOfferPrice>[] = [];

      for (const item of priceData) {
        const date = item.Date;

        for (const entity of item.HourlyEntities) {
          // Obtener el valor máximo de las horas
          const hourlyValues = Object.entries(entity.Values)
            .filter(([key]) => key.startsWith("Hour")) // Filtrar por claves que empiezan con "Hour"
            .map(([, value]) => parseFloat(value as string)); // Convertir los valores a números

          const maxPrice = Math.max(...hourlyValues); // Obtener el valor máximo
          const existingPrice = await maxOfferPriceRepository.findOne({
            where: { date },
          });

          if (!existingPrice) {
            const newMaxPrice = maxOfferPriceRepository.create({
              date,
              maxPrice,
            });

            promises.push(maxOfferPriceRepository.save(newMaxPrice));
          }
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.error(
        "Error al actualizar los datos de máximo precio de oferta:",
        error
      );
    }
  }
}
