import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ExecutionLog } from "../entity/ExecutionLog";

export class ExecutionLogService {
  private readonly defaultDate = new Date("2024-09-01");

  /**
   * Obtiene la última fecha de ejecución de un proceso.
   * @param code Identificador del proceso.
   * @returns La fecha de la última ejecución o una fecha por defecto si no hay registros.
   */
  async getLastExecutionDate(code: string): Promise<Date> {
    try {
      const executionLogRepository = AppDataSource.getRepository(ExecutionLog);
      const log = await executionLogRepository.findOne({ where: { code } });
      return log ? log.lastExecution : new Date(this.defaultDate.getTime());
    } catch (error) {
      console.error("Error al obtener la fecha de la última ejecución:", error);
    }
  }

  /**
   * Actualiza la fecha de la última ejecución de un proceso.
   * @param code Identificador del proceso.
   * @param entityRepository Repositorio de la entidad (opcional).
   * @param dateField Campo de fecha en la entidad (opcional, por defecto "date").
   */
  async updateLastExecutionDate<T>(
    code: string,
    entityRepository?: Repository<T>,
    dateField: string = "date"
  ): Promise<void> {
    const executionLogRepository = AppDataSource.getRepository(ExecutionLog);

    let maxDate: Date;

    if (entityRepository) {
      // Buscar la fecha máxima en la entidad si se proporciona un repositorio
      const latestEntry = await entityRepository
        .createQueryBuilder("entity")
        .select(`MAX(entity.${dateField})`, "maxDate")
        .getRawOne();

      if (latestEntry && latestEntry.maxDate) {
        maxDate = new Date(latestEntry.maxDate);
        maxDate.setDate(maxDate.getDate() + 1); // Sumar un día
      } else {
        maxDate = new Date(); // Usar la fecha actual si no hay entradas
      }
    } else {
      // Usar la fecha actual si no se pasa un repositorio
      maxDate = new Date();
    }

    const existingLog = await executionLogRepository.findOne({ where: { code } });

    if (existingLog) {
      // Actualizar la fecha de la última ejecución
      existingLog.lastExecution = maxDate;
      await executionLogRepository.save(existingLog);
    } else {
      // Crear un nuevo registro si no existe
      const newLog = executionLogRepository.create({
        code,
        lastExecution: maxDate,
      });
      await executionLogRepository.save(newLog);
    }
  }
}
