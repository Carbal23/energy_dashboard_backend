import { AppDataSource } from "../data-source";
import { RealAvailability } from "../entity/RealAvailability";
import axios from "axios";
import { configDotenv } from "dotenv";
import { ExecutionLogService } from "./executionLogService";
import { Codes, parametersPerDay } from "../utils/settings";

configDotenv({ path: "variables.env" });

export class RealAvailabilityService {
  private readonly apiUrl =
    process.env.API_URL_HOURLY || "https://servapibi.xm.com.co/hourly"; // URL de la API para disponibilidad
  private readonly code = Codes.availability; // Código para disponibilidad
  private readonly executionLogService: ExecutionLogService;
  private readonly maxDays = parametersPerDay.maxDays; // Número máximo de días permitidos por la API
  private readonly safeDays = parametersPerDay.safeDays; // Número de días seguros para asegurar que la información está disponible

  constructor() {
    // Inicializar el atributo executionLogService en el constructor
    this.executionLogService = new ExecutionLogService();
}

  async checkAndUpdateAvailability() {
    // Obtener la última fecha de actualización, si no hay, usar la fecha por defecto
    let lastUpdate = await this.executionLogService.getLastExecutionDate(this.code);
    const currentDate = new Date();

    // Definir la fecha límite segura (7 días antes de la fecha actual)
    const safeDate = new Date(currentDate);
    safeDate.setDate(currentDate.getDate() - this.safeDays); // Fecha segura

    if (lastUpdate < safeDate) {
      // Ciclo para dividir la actualización en bloques de 31 días
      while (lastUpdate < safeDate) {
        // Calcular el rango de fechas
        let startDate = new Date(lastUpdate);

        // Definir la fecha de fin con un máximo de 31 días
        let endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + this.maxDays - 1);

        // Asegurarse de que la fecha de fin no sea mayor que la fecha segura
        if (endDate > safeDate) {
          endDate = safeDate;
        }

        // Ejecutar la actualización con el rango de fechas calculado
        await this.updateAvailabilityData(startDate, endDate);

        // Establecer lastUpdate como el nuevo endDate para continuar con el siguiente bloque
        lastUpdate.setTime(endDate.getTime() + 86400000); // Incrementar en 1 día
      }

      console.log("Actualización de datos de disponibilidad completada.");

      const realAvailabilityRepository =
        AppDataSource.getRepository(RealAvailability);
      await this.executionLogService.updateLastExecutionDate(this.code, realAvailabilityRepository);
    } else {
      console.log(
        `Generacion real actualizada a fecha de hoy menos ${safeDate} dias`
      );
    }
  }

  private async updateAvailabilityData(startDate: Date, endDate: Date) {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const requestBody = {
        MetricId: "DispoReal",
        StartDate: formattedStartDate,
        EndDate: formattedEndDate,
        Entity: "Recurso",
      };

      const response = await axios.post(this.apiUrl, requestBody);
      const availabilityData = response.data.Items;

      const availabilityRepository =
        AppDataSource.getRepository(RealAvailability);
      const promises: Promise<RealAvailability>[] = [];

      for (const item of availabilityData) {
        const date = item.Date;

        for (const entity of item.HourlyEntities) {
          const resourceCode = entity.Values.code;
          const hourlyValues = entity.Values;

          let totalAvailability = 0;
          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `Hour${hour.toString().padStart(2, "0")}`;
            totalAvailability += parseFloat(hourlyValues[hourKey]) || 0;
          }

          const existingAvailability = await availabilityRepository.findOne({
            where: { date, code: resourceCode },
          });

          if (!existingAvailability) {
            const newAvailability = availabilityRepository.create({
              date,
              code: resourceCode,
              totalAvailability,
            });

            // Agregar la promesa a la lista
            promises.push(availabilityRepository.save(newAvailability));
          }
        }
      }

      // Esperar a que todas las promesas de guardado se resuelvan
      await Promise.all(promises);
    } catch (error) {
      console.error("Error al actualizar los datos de disponibilidad:", error);
    }
  }
}
