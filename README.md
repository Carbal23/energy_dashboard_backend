# Energía Dashboard Backend

## Descripción del Proyecto

Este proyecto es el backend del **Energía Dashboard**, una aplicación analítica que recopila, transforma y almacena datos relevantes del sector de la energía en Colombia. Utiliza una API externa proporcionada por [EquipoAnaliticaXM](https://github.com/EquipoAnaliticaXM/API_XM) para obtener información relacionada con generación, demanda y precios del mercado eléctrico. Estos datos se procesan y almacenan en una base de datos PostgreSQL para ser consumidos posteriormente por herramientas como Power BI, permitiendo la creación de dashboards analíticos.

---

## Tecnologías Utilizadas

El proyecto está desarrollado con las siguientes tecnologías:

- **Node.js**: Entorno de ejecución de JavaScript en el servidor.
- **TypeScript**: Lenguaje tipado que extiende JavaScript.
- **TypeORM**: ORM (Object-Relational Mapping) para manejar la base de datos.
- **PostgreSQL**: Base de datos relacional utilizada para almacenar la información procesada.
- **Axios**: Cliente HTTP para consumir la API externa.
- **dotenv**: Manejo de variables de entorno.
- **reflect-metadata**: Librería necesaria para TypeORM.

---

## Requisitos Previos

Antes de iniciar, asegúrate de tener instalado:

1. **Node.js** (versión 16 o superior).
2. **PostgreSQL** (configurado y en ejecución).
3. **npm** (normalmente viene con Node.js).

---

## Instalación

Sigue los siguientes pasos para configurar y ejecutar el proyecto localmente:

1. Clona el repositorio:
   ```bash
   git clone <URL-del-repositorio>
   cd energia-dashboard-backend
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo llamado `variables.env` en la raíz del proyecto.
   - Agrega la configuración necesaria:
     ```env
     PG_HOST=localhost
     PG_PORT=5432
     PG_USER=postgres
     PG_PASSWORD=tu_contraseña
     PG_DB=energia_Col_DB
     ```

4. Inicializa la base de datos:
   - Asegúrate de que tu base de datos PostgreSQL esté corriendo.

5. Inicia el proyecto en modo desarrollo:
   ```bash
   npm run dev
   ```

---

## Uso

El backend se encarga de consumir la API externa y almacenar los datos transformados en la base de datos. Los servicios principales son ejecutados en el archivo `index.ts`, donde se inicializan las conexiones y se ejecutan los procesos automáticos de actualización.

## Funcionalidades Principales
1. Almacenamiento de datos históricos de generación y demanda eléctrica.
2. Análisis de disponibilidad de recursos por región y tipo.
3. Seguimiento de precios en el mercado eléctrico.
4. Registro de ejecución de servicios y actualizaciones.

## Estructura de las Entidades

A continuación, se describen los modelos de datos utilizados en el sistema:

### 1. `ExecutionLog`
Guarda los registros de actualizaciones de servicios para identificar la última ejecución por código.
- **Columnas**:
  - `id`: Identificador único.
  - `code`: Código identificador del servicio.
  - `lastExecution`: Fecha de la última ejecución.

### 2. `RealGeneration`
Registra la generación neta real diaria para cada recurso.
- **Columnas**:
  - `id`: Identificador único.
  - `date`: Fecha de generación (Ej: '2024-01-04').
  - `netGeneration`: Generación neta total en kWh.
  - `resourceCode`: Código del recurso asociado.

### 3. `RealAvailability`
Registra la disponibilidad total diaria de cada recurso.
- **Columnas**:
  - `id`: Identificador único.
  - `code`: Código del recurso.
  - `date`: Fecha del registro.
  - `totalAvailability`: Disponibilidad total en kW para el día.

### 4. `Resource`
Lista los recursos y unidades generadoras disponibles en el sistema.
- **Columnas**:
  - `id`: Identificador único.
  - `code`: Código único del recurso.
  - `name`: Nombre de la planta generadora.
  - `type`: Tipo de planta (Ej: HIDRAULICA, TERMICA).
  - `disp`: Estado de despacho (Ej: DESPACHADO, NO DESPACHADO CENTRALMENTE).
  - `recType`: Tipo de recurso (Ej: GEN. DISTRIBUIDA).
  - `companyCode`: Código de la compañía propietaria.
  - `enerSource`: Fuente de energía (Ej: AGUA, VIENTO).
  - `operStartDate`: Fecha de inicio de operación.
  - `state`: Estado actual (Ej: OPERACION).

### 5. `TotalDemand`
Registra la suma total diaria de la demanda eléctrica.
- **Columnas**:
  - `id`: Identificador único.
  - `date`: Fecha del registro.
  - `totalDemand`: Demanda total diaria.

### 6. `MaxDemand`
Registra la demanda máxima diaria.
- **Columnas**:
  - `id`: Identificador único.
  - `date`: Fecha del registro.
  - `maxDemand`: Demanda máxima registrada.

### 7. `RegionalDemand`
Registra la demanda eléctrica por región.
- **Columnas**:
  - `id`: Identificador único.
  - `date`: Fecha del registro.
  - `code`: Código de la región.
  - `marketType`: Tipo de mercado.
  - `totalDemand`: Demanda total de la región.

### 8. `StockMarketPrice`
Registra los precios promedio diarios en el mercado eléctrico.
- **Columnas**:
  - `id`: Identificador único.
  - `date`: Fecha del registro.
  - `price`: Precio promedio en el mercado.

### 9. `MaxOfferPrice`
Registra el precio máximo diario de ofertas en el mercado eléctrico.
- **Columnas**:
  - `id`: Identificador único.
  - `date`: Fecha del registro.
  - `maxPrice`: Precio máximo registrado.

### Principales Servicios

Los servicios incluidos en el proyecto son:

1. **ResourceService**: Actualiza los recursos energéticos registrados.
2. **GenerationService**: Actualiza la información de generación real.
3. **RealAvailabilityService**: Actualiza la disponibilidad real.
4. **TotalDemandService**: Actualiza los datos de la demanda total.
5. **RegionalDemandService**: Actualiza los datos de la demanda por regiones.
6. **MaxDemandService**: Actualiza los datos de la demanda máxima.
7. **StockMarketPriceService**: Actualiza los precios del mercado.
8. **MaxOfferPriceService**: Actualiza los precios máximos de oferta.

---

## Estructura del Proyecto

La estructura del proyecto es la siguiente:

```plaintext
energia-dashboard-backend/
├── src/
│   ├── entity/         # Modelos de las entidades de la base de datos
│   ├── services/       # Lógica de los servicios para procesar datos
│   ├── util/           # Funciones útiles y reutilizables
│   ├── data-source.ts  # Configuración de la conexión a la base de datos
│   ├── index.ts        # Punto de entrada principal
├── variables.env       # Variables de entorno
├── package.json        # Dependencias y scripts
```

---

## Ejecución del Proyecto

El backend ejecuta todos los servicios automáticamente al iniciar el servidor. Los datos consumidos desde la API externa son transformados a modelos definidos en las entidades y almacenados en PostgreSQL.

Ejemplo de inicialización en `index.ts`:

```typescript
const main = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Conexión a la base de datos establecida.");

        const resourceService = new ResourceService();
        await resourceService.checkAndUpdateResources();

        console.log("Proceso de actualización completado.");
    } catch (error) {
        console.error("Error durante la inicialización:", error);
    }
};

main();
```

---

## Licencia

Este proyecto está licenciado bajo los términos de la licencia [MIT](LICENSE).

---

## Autores

- [Tu Nombre]

