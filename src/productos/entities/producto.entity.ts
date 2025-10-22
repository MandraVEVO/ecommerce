import { User } from "src/users/entities/user.entity";
import { Rating } from "src/rating/entities/rating.entity";
import { ProductLike } from "src/rating/entities/product-like.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    //  RELACIÓN: Muchos productos pertenecen a UN proveedor
    @ManyToOne(() => User, (user) => user.productos, {
        eager: false,
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'proveedorId' })
    proveedor: User;

    @Column('uuid')
    proveedorId: string;

    // NUEVA RELACIÓN: Un producto puede tener MUCHAS calificaciones
    @OneToMany(() => Rating, (rating) => rating.producto)
    ratings?: Rating[];

    // NUEVA RELACIÓN: Un producto puede tener MUCHOS likes
    @OneToMany(() => ProductLike, (like) => like.producto)
    likes?: ProductLike[];

    // CAMPOS CALCULADOS (se pueden agregar como métodos o computed properties)
    // Promedio de calificación
    averageRating?: number;
    
    // Total de calificaciones
    totalRatings?: number;
    
    // Total de likes
    totalLikes?: number;
    
    // Si el usuario actual dio like (se calcula en runtime)
    isLiked?: boolean;
}
