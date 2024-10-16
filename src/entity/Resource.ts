import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Resource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Código de la planta generadora

  @Column()
  name: string; // Nombre de la planta generadora

  @Column()
  type: string; // Tipo de planta (Ej: HIDRAULICA, TERMICA, etc.)

  @Column()
  disp: string; // Estado de despacho (Ej: DESPACHADO, NO DESPACHADO CENTRALMENTE)

  @Column()
  recType: string; // Tipo de recurso (Ej: GEN. DISTRIBUIDA)

  @Column()
  companyCode: string; // Código de la compañía a la que pertenece

  @Column()
  enerSource: string; // Fuente de energía (Ej: AGUA, VIENTO, etc.)

  @Column()
  operStartDate: Date; // Fecha de inicio de operación

  @Column()
  state: string; // Estado actual de la planta (Ej: OPERACION)
}
