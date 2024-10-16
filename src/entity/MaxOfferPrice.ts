import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MaxOfferPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "float" })
  maxPrice: number;
}
