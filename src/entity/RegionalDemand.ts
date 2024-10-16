import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class RegionalDemand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: string;

  @Column()
  code: string;

  @Column()
  marketType: string;

  @Column({ type: "float" })
  totalDemand: number;
}
