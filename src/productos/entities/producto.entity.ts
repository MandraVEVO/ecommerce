import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Producto {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    nombre: string;

    @Column('text', { nullable: true })
    descripcion: string;

    @Column('decimal', { precision: 10, scale: 2 })
    precio: number;

    @Column('text', { nullable: true })
    imagen: string;

    @Column('boolean', { default: true })
    isAvailable: boolean;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column('timestamp with time zone', { nullable: true })
    deletedAt: Date | null;

    @Column('boolean', { default: false })
    isApproved: boolean;

    // ✅ RELACIÓN: Muchos productos pertenecen a UN proveedor
    @ManyToOne(() => User, (user) => user.productos, {
        eager: false, // No cargar automáticamente el proveedor
        nullable: false, // El producto DEBE tener un proveedor
        onDelete: 'CASCADE' // Si se elimina el proveedor, se eliminan sus productos
    })
    @JoinColumn({ name: 'proveedorId' }) // Nombre de la columna FK en la BD
    proveedor: User;

    // ✅ Columna de FK (se crea automáticamente pero la declaramos para poder usarla)
    @Column('uuid')
    proveedorId: string;
}
