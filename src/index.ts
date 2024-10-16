import { AppDataSource } from "./data-source"
import { GenerationService } from "./services/generationService";
import { MaxDemandService } from "./services/maxDemandService";
import { MaxOfferPriceService } from "./services/maxOfferPriceService";
import { RealAvailabilityService } from "./services/realAvailabilityService";
import { RegionalDemandService } from "./services/regionalDemandService";
import { ResourceService } from "./services/resourceService";
import { StockMarketPriceService } from "./services/stockMarketPriceService";
import { TotalDemandService } from "./services/totalDemandService";

// Función principal que inicializa la base de datos y ejecuta ResourceService

const main = async () => {
    try {
      // Inicializar la conexión a la base de datos
      await AppDataSource.initialize();
      console.log("Conexión a la base de datos establecida.");
  
      const resourceService = new ResourceService();
      const generationService = new GenerationService();
      const realAvailabilityService = new RealAvailabilityService();
      const totalDemandService = new TotalDemandService();
      const regionalDemandService = new RegionalDemandService;
      const maxDemandService = new MaxDemandService();
      const stockMarketPriceService = new StockMarketPriceService();
      const maxOfferPriceService = new MaxOfferPriceService();

      await resourceService.checkAndUpdateResources();

      await generationService.checkAndUpdateGeneration();
        
      await realAvailabilityService.checkAndUpdateAvailability();

      await totalDemandService.checkAndUpdateTotalDemand();

      await regionalDemandService.checkAndUpdateRegionalDemand();

      await maxDemandService.checkAndUpdateMaxDemand();

      await stockMarketPriceService.checkAndUpdatePrice();

      await maxOfferPriceService.checkAndUpdateMaxOfferPrice();
    
      console.log("Proceso de actualizacion completado.");
    } catch (error) {
      console.error("Error durante la inicialización:", error);
    }
  };
  
  // Ejecutar la función principal al iniciar el servidor
  main();