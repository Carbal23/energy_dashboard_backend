import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class MaxDemand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "float" })
  maxDemand: number;
}
