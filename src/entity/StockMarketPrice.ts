import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class StockMarketPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "float" })
  price: number;
}
