import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ExecutionLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 4 }) // Código identificador
    code: string;

    @Column({ type: 'timestamp' }) // Fecha de la última ejecución
    lastExecution: Date;
}