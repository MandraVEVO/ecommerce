import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Producto } from 'src/productos/entities/producto.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //  RELACIÓN: Muchas calificaciones pertenecen a UN usuario (cliente)
  @ManyToOne(() => User, (user) => user.ratings, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  //  RELACIÓN: Muchas calificaciones pertenecen a UN producto
  @ManyToOne(() => Producto, (producto) => producto.ratings, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'productoId' })
  producto: Producto;

  @Column('uuid')
  productoId: string;

  // Calificación de 1 a 5 estrellas
  @Column('int', { 
    comment: 'Calificación de 1 a 5 estrellas'
  })
  rating: number; // 1, 2, 3, 4, 5

  // Reseña o comentario del cliente
  @Column('text', { nullable: true })
  review?: string;

  // Verificar si el usuario compró el producto (opcional, para futuro)
  @Column('boolean', { default: false })
  isVerifiedPurchase: boolean;

  // Respuesta del proveedor (opcional)
  @Column('text', { nullable: true })
  proveedorResponse?: string;

  @Column('timestamp with time zone', { nullable: true })
  proveedorRespondedAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column('timestamp with time zone', { nullable: true })
  deletedAt?: Date | null;
}
