import { AppDataSource } from "../data-source"
import { Resource } from '../entity/Resource';
import axios from 'axios';
import { configDotenv } from "dotenv";
import { getLastExecutionDate, updateLastExecutionDate } from "../utils/executionLogUtil";
import { Codes } from "../utils/settings";

configDotenv({path: 'variables.env'});

export class ResourceService {
    private readonly apiUrl =  process.env.API_URL_METRICS || "https://servapibi.xm.com.co/lists";
    private readonly code = Codes.resource;

    async checkAndUpdateResources() {
        // Verificar si debe actualizar los recursos
        const lastUpdate = await getLastExecutionDate(this.code);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        if (lastUpdate < oneMonthAgo) {
            // Si la última actualización fue hace más de un mes, proceder a la actualización
            await this.updateResources();
        } else {
            console.log('No es necesario actualizar los recursos. Última actualización fue hace menos de un mes.');
        }
    }

    private async updateResources() {
        try {
            // Cuerpo de la solicitud POST
            const requestBody = {
                MetricId: "ListadoRecursos"
            };
    
            // Obtener los datos de la API
            const response = await axios.post(this.apiUrl, requestBody);
            const resources = response.data.Items; // Aquí se obtiene el array Items
    
            const resourceRepository = AppDataSource.getRepository(Resource);
            const promises: Promise<Resource>[] = []; // Array para almacenar las promesas de tipo Resource
    
            for (const item of resources) {
                // Iterar sobre cada item y extraer ListEntities
                for (const entity of item.ListEntities) {
                    const resourceData = entity.Values; // Extraer Values donde están los datos
    
                    // Validar duplicados usando el código del recurso
                    const existingResource = await resourceRepository.findOne({ where: { code: resourceData.Code } });
                    if (!existingResource) {
                        // Crear un nuevo recurso usando el objeto de la API
                        const newResource = resourceRepository.create({
                            code: resourceData.Code,
                            name: resourceData.Name,
                            type: resourceData.Type,
                            disp: resourceData.Disp,
                            recType: resourceData.RecType,
                            companyCode: resourceData.CompanyCode,
                            enerSource: resourceData.EnerSource,
                            operStartDate: new Date(resourceData.OperStartdate), // Convertir a Date
                            state: resourceData.State
                        });
    
                        // Agregar la promesa de guardar el nuevo recurso
                        promises.push(resourceRepository.save(newResource));
                    }
                }
            }
    
            // Esperar a que todas las promesas se resuelvan
            await Promise.all(promises);
    
            // Actualizar la fecha de la última actualización
            await updateLastExecutionDate(this.code);
    
        } catch (error) {
            console.error('Error al actualizar los recursos:', error);
        }
    }

    
}