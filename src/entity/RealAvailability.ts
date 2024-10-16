import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('real_availability') // Nombre de la tabla en la base de datos
export class RealAvailability {
    @PrimaryGeneratedColumn()
    id: number; // ID único para cada entrada

    @Column({ type: 'varchar', length: 10 }) // Ajusta el tamaño según necesites
    code: string; // Código del recurso

    @Column({ type: 'date' })
    date: Date; // Fecha del registro

    @Column({ type: 'float' }) // o 'decimal' si prefieres
    totalAvailability: number; // Suma total de la disponibilidad en kW para el día
}