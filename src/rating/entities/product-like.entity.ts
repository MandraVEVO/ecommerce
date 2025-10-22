import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Producto } from 'src/productos/entities/producto.entity';

@Entity('product_likes')
@Unique(['userId', 'productoId']) //  Un usuario solo puede dar like UNA VEZ por producto
export class ProductLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // RELACIÓN: Muchos likes pertenecen a UN usuario
  @ManyToOne(() => User, (user) => user.likedProducts, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  //  RELACIÓN: Muchos likes pertenecen a UN producto
  @ManyToOne(() => Producto, (producto) => producto.likes, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'productoId' })
  producto: Producto;

  @Column('uuid')
  productoId: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}