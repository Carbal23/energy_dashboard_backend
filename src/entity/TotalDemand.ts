import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class TotalDemand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column("float")
  totalDemand: number; // Suma de la demanda total diaria
}