import { Repository } from "typeorm";
import { AppDataSource } from "../data-source"
import { ExecutionLog } from '../entity/ExecutionLog';

/**
 * Función para obtener la última fecha de ejecución de un proceso.
 * @param code Identificador del proceso (por ejemplo, 'RESO' para resource)
 * @returns La fecha de la última ejecución o una fecha muy antigua si no hay registros.
 */

const defaultDate =  new Date('2024-09-01'); 

export async function getLastExecutionDate(code: string): Promise<Date> {
    const executionLogRepository = AppDataSource.getRepository(ExecutionLog);
    const log = await executionLogRepository.findOne({
        where: { code }
    });
    return log ? log.lastExecution : new Date(defaultDate.getTime()); // Si no hay log, devolver fecha por defecto
}


/**
 * Función para actualizar la fecha de la última ejecución de un proceso.
 * @param code Identificador del proceso (por ejemplo, 'RESO' para resource)
 * @param lastUpdate Fecha con la que se actualizara el code en data base
 */
// Actualizar la fecha de la última ejecución, con o sin una entidad específica
export async function updateLastExecutionDate<T>(
  code: string,
  entityRepository?: Repository<T>, // Hacemos que el repositorio sea opcional
  dateField: string = "date" // Campo de fecha por defecto
): Promise<void> {
  const executionLogRepository = AppDataSource.getRepository(ExecutionLog);

  let maxDate: Date;

  if (entityRepository) {
    // Si se pasa un repositorio, buscamos la fecha máxima en la entidad
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
    // Si no se pasa un repositorio, simplemente usamos la fecha actual
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

  