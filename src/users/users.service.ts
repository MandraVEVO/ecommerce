import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProveedorDto } from './dto/updateProveedor.dto';
import { User } from './entities/user.entity';
import { UserRoles } from 'src/common/enums/user-roles.enum';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() }
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'fullName', 'role', 'isActive', 'createdAt'] // Incluir password
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id }
    });
  }

  async softRemove(id: string) {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Marcar como inactivo en lugar de eliminar
    await this.userRepository.update(id, { isActive: false });

    return {
      message: 'Usuario desactivado exitosamente',
      userId: id
    };
  }

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAllProveedores() {
    return this.userRepository.find({
      where: { 
        isActive: true,
        role: UserRoles.PROVEEDOR 
      },
      select: ['id', 'email', 'fullName', 'role', 'isActive'], 
      order: { createdAt: 'DESC' } 
    });
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  updateProveedorRol(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  async updateToProveedor(id: string): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    await this.userRepository.update(id, { 
      role: UserRoles.PROVEEDOR 
    });

    const updatedUser = await this.findById(id);
    
    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado después de la actualización`);
    }
    
    return updatedUser;
  }

  async updateProveedor(id: string, updateProveedorDto: UpdateProveedorDto) {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    if (user.role !== UserRoles.PROVEEDOR) {
      throw new BadRequestException('Este endpoint es solo para usuarios con rol de proveedor');
    }

    

    const updateData = {
      ...updateProveedorDto,
      isActive: false,
      updatedAt: new Date(),
    };

    // 5. Actualizar en la base de datos
    await this.userRepository.update(id, updateData);

    // 6. Obtener y retornar el usuario actualizado con todos los campos
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'fullName',
        'role',
        'isActive',
        'nombreEmpresa',
        'direccion',
        'giro',
        'descripcion',
        'telefono',
        'wasap',
        'horario',
        'metodoPago',
        'verificado',
        'createdAt',
        'updatedAt'
      ]
    });

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado después de la actualización`);
    }

    return {
      message: 'Perfil de proveedor actualizado exitosamente',
      proveedor: updatedUser
    };
  }

  async findProveedorById(id: string) {
    const proveedor = await this.userRepository.findOne({
      where: { 
        id,
        role: UserRoles.PROVEEDOR,
        isActive: true
      },
      select: [
        'id',
        'email',
        'fullName',
        'role',
        'isActive',
        'nombreEmpresa',
        'direccion',
        'giro',
        'descripcion',
        'telefono',
        'wasap',
        'horario',
        'metodoPago',
        'verificado',
        'createdAt',
        'updatedAt'
      ]
    });

    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
    }

    return proveedor;
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }

  async updateToAdmin(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    await this.userRepository.update(id, { 
      role: UserRoles.ADMIN 
    });
    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado después de la actualización`);
    }
    return updatedUser;
  }
  
}
