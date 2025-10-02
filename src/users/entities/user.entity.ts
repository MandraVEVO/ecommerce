import { UserRoles } from './../../common/enums/user-roles.enum';
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}
