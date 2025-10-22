import { MetodoPago } from 'src/common/enums/metodo-pago.enum';
import { UserRoles } from './../../common/enums/user-roles.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Producto } from 'src/productos/entities/producto.entity';

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    email: string;
    @Column('text', { select: false })
    password: string;

    @Column('text')
    fullName: string;

    @Column({ type: 'enum', enum: UserRoles, default: UserRoles.CLIENTE })
    role: UserRoles;

    @Column('boolean', { default: true })
    isActive: boolean;
    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column('timestamp with time zone', { nullable: true })
    deletedAt: Date | null;

    @Column('text', { nullable: true }) 
    nombreEmpresa?: string;

    @Column('text', { nullable: true })
    direccion?: string;

    @Column('text', { nullable: true })
    giro: string;

    @Column('text', { nullable: true })
    descripcion?: string;

    @Column('text', { nullable: true })
    telefono?: string;

    @Column('text', { nullable: true })
    wasap?: string;

    @Column('text', { nullable: true })
    horario?: string;

    @Column('boolean', { default: false }) 
    verificado: boolean;

    @Column({ type: 'enum', enum: MetodoPago, default: MetodoPago.CUERPO })
    metodoPago?: MetodoPago;

    @Column('text', { nullable: true })
    compraMinima?: string;

     // ✅ RELACIÓN: Un proveedor puede tener MUCHOS productos
    @OneToMany(() => Producto, (producto) => producto.proveedor)
    productos?: Producto[];

}
