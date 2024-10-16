import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RealGeneration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string; // Fecha de la generación (por ejemplo, '2024-01-04')

  @Column('float')
  netGeneration: number; // Generación neta en kWh sumada de todas las horas

  @Column()
  resourceCode: string; // Código del recurso (relacionado con Resource)
}