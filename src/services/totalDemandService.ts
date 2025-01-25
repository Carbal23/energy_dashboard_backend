import { AppDataSource } from "../data-source";
import { TotalDemand } from "../entity/TotalDemand"; // Cambiar a la nueva entidad "TotalDemand"
import axios from "axios";
import { configDotenv } from "dotenv";
import {
  getLastExecutionDate,
  updateLastExecutionDate,
} from "../utils/executionLogUtil";
import { Codes, parametersPerDay } from "../utils/settings";

configDotenv({ path: "variables.env" });

export class TotalDemandService {
  private readonly apiUrl =
    process.env.API_URL_HOURLY || "https://servapibi.xm.com.co/hourly"; // URL de la API para demanda
  private readonly code = Codes.totalDemand; // Código para la demanda total, puedes cambiarlo según sea necesario
  private readonly maxDays = parametersPerDay.maxDays; // Número máximo de días permitidos por la API
  private readonly safeDays = parametersPerDay.safeDays; // Número de días seguros para asegurar que la información está disponible

  async checkAndUpdateTotalDemand() {
    // Obtener la última fecha de actualización, si no hay, usar la fecha por defecto
    let lastUpdate = await getLastExecutionDate(this.code);
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

        // Asegurarse de que la fecha de fin no sea mayor que la fecha de ayer
        if (endDate > safeDate) {
          endDate = safeDate;
        }

        // Ejecutar la actualización con el rango de fechas calculado
        await this.updateTotalDemandData(startDate, endDate);

        // Establecer lastUpdate como el nuevo endDate para continuar con el siguiente bloque
        lastUpdate.setTime(endDate.getTime() + 86400000); // Incrementar en 1 día
        
      }

      console.log("Actualización de demanda total completada.");
      
      const totalDemandRepository = AppDataSource.getRepository(TotalDemand);
      await updateLastExecutionDate(this.code, totalDemandRepository);
    } else {
      console.log(`Generacion real actualizada a fecha de hoy menos ${safeDate} dias`);
    }
  }

  private async updateTotalDemandData(startDate: Date, endDate: Date) {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      // Cambiar el cuerpo de la petición para adaptarse a la demanda
      const requestBody = {
        MetricId: "DemaCome", // Demanda comercial
        StartDate: formattedStartDate,
        EndDate: formattedEndDate,
        Entity: "Sistema",
      };

      const response = await axios.post(this.apiUrl, requestBody);
      const demandData = response.data.Items;

      const demandRepository = AppDataSource.getRepository(TotalDemand);
      const promises: Promise<TotalDemand>[] = [];

      for (const item of demandData) {
        const date = item.Date;
        let totalDemand = 0;

        // Iterar sobre las horas para sumar la demanda total del día
        for (const entity of item.HourlyEntities) {
          const hourlyValues = entity.Values;

          let dailyDemand = 0;
          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `Hour${hour.toString().padStart(2, "0")}`;
            dailyDemand += parseFloat(hourlyValues[hourKey]) || 0;
          }

          totalDemand += dailyDemand; // Sumar la demanda del sistema
        }

        // Comprobar si ya existe un registro para esa fecha
        const existingDemand = await demandRepository.findOne({
          where: { date },
        });

        if (!existingDemand) {
          const newDemand = demandRepository.create({
            date,
            totalDemand,
          });

          // Agregar la promesa a la lista
          promises.push(demandRepository.save(newDemand));
        }
      }

      // Esperar a que todas las promesas de guardado se resuelvan
      await Promise.all(promises);
    } catch (error) {
      console.error("Error al actualizar los datos de demanda total:", error);
    }
  }
}
