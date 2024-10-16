import { AppDataSource } from "../data-source";
import { RealGeneration } from "../entity/RealGeneration";
import axios from "axios";
import { configDotenv } from "dotenv";
import {
  getLastExecutionDate,
  updateLastExecutionDate,
} from "../utils/executionLogUtil";
import { codes, parametersPerDay } from "../utils/codes";

configDotenv({ path: "variables.env" });

export class GenerationService {
  private readonly apiUrl =
    process.env.API_URL_HOURLY || "https://servapibi.xm.com.co/hourly"; // URL de la API para generación
  private readonly code = codes.generation; // Código para generación, puedes cambiarlo según sea necesario
  private readonly maxDays = parametersPerDay.maxDays; // Número máximo de días permitidos por la API
  private readonly safeDays = parametersPerDay.safeDays; // Número de días seguros para asegurar que la información está disponible

  async checkAndUpdateGeneration() {
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
        await this.updateGenerationData(startDate, endDate);

        // Establecer lastUpdate como el nuevo endDate para continuar con el siguiente bloque
        lastUpdate.setTime(endDate.getTime() + 86400000); // Incrementar en 1 día
        
      }

      console.log("Actualización de datos de generación completada.");
    
      const generationRepository = AppDataSource.getRepository(RealGeneration);
      await updateLastExecutionDate(this.code, generationRepository);
    } else {
      console.log("Generacion real actualizada a fecha de hoy menos 7 dias");
    }
  }

  private async updateGenerationData(startDate: Date, endDate: Date) {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const requestBody = {
        MetricId: "Gene",
        StartDate: formattedStartDate,
        EndDate: formattedEndDate,
        Entity: "Recurso",
      };

      const response = await axios.post(this.apiUrl, requestBody);
      const generationData = response.data.Items;

      const generationRepository = AppDataSource.getRepository(RealGeneration);
      const promises: Promise<RealGeneration>[] = [];

      for (const item of generationData) {
        const date = item.Date;

        for (const entity of item.HourlyEntities) {
          const resourceCode = entity.Values.code;
          const hourlyValues = entity.Values;

          let netGeneration = 0;
          for (let hour = 1; hour <= 24; hour++) {
            const hourKey = `Hour${hour.toString().padStart(2, "0")}`;
            netGeneration += parseFloat(hourlyValues[hourKey]) || 0;
          }

          const existingGeneration = await generationRepository.findOne({
            where: { date, resourceCode },
          });

          if (!existingGeneration) {
            const newGeneration = generationRepository.create({
              date,
              resourceCode,
              netGeneration,
            });

            // Agregar la promesa a la lista
            promises.push(generationRepository.save(newGeneration));
          }
        }
      }

      // Esperar a que todas las promesas de guardado se resuelvan
      await Promise.all(promises);
    } catch (error) {
      console.error("Error al actualizar los datos de generación:", error);
    }
  }
  
}
