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
    // 1. Verificar que el usuario existe
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // 2. VALIDAR que solo se puedan eliminar CLIENTES o PROVEEDORES
    if (user.role !== UserRoles.CLIENTE && user.role !== UserRoles.PROVEEDOR) {
      throw new BadRequestException(
        `No se puede eliminar usuarios con rol ${user.role}. Solo se pueden eliminar clientes y proveedores.`
      );
    }

    // 3. Marcar como inactivo en lugar de eliminar
    await this.userRepository.update(id, { 
      isActive: false,
      updatedAt: new Date(),
    });

    return {
      message: `Usuario ${user.role} desactivado exitosamente`,
      userId: id,
      userEmail: user.email,
      userRole: user.role
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

  async findAllProveedoresInactivos() {
    return this.userRepository.find({
      where: { 
        isActive: false,
        role: UserRoles.PROVEEDOR 
      },
      select: ['id', 'email', 'fullName', 'role', 'isActive'], 
      order: { createdAt: 'DESC' } 
    });
  }

  async hardRemove(id: string) {
    // 1. Verificar que el usuario existe
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    //  2. VALIDAR que solo se puedan eliminar CLIENTES o PROVEEDORES
    if (user.role !== UserRoles.CLIENTE && user.role !== UserRoles.PROVEEDOR) {
      throw new BadRequestException(
        `No se puede eliminar usuarios con rol ${user.role}. Solo se pueden eliminar clientes y proveedores.`
      );
    }

    // 3. Eliminar permanentemente
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`No se pudo eliminar el usuario con ID ${id}`);
    }

    return {
      message: `Usuario ${user.role} eliminado permanentemente`,
      userId: id,
      userEmail: user.email,
      userRole: user.role
    };
  }


  async updateToAdmin(userId: string) {
  // 1. Verificar que el usuario existe
  const user = await this.findById(userId);
  
  if (!user) {
    throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
  }

  // 2. Verificar que el usuario esté activo
  if (!user.isActive) {
    throw new BadRequestException('El usuario está inactivo y no puede ser actualizado');
  }

  // 3. Verificar que no sea ya un admin
  if (user.role === UserRoles.ADMIN) {
    throw new BadRequestException('El usuario ya tiene rol de administrador');
  }

  // 4. Guardar el rol anterior
  const previousRole = user.role;

  // ✅ 5. ACTUALIZAR el rol a ADMIN en la base de datos
  await this.userRepository.update(userId, { 
    role: UserRoles.ADMIN,
    updatedAt: new Date()
  });

  // ✅ 6. Obtener el usuario actualizado desde la BD
  const updatedUser = await this.findById(userId);

  if (!updatedUser) {
    throw new NotFoundException(`Usuario con ID ${userId} no encontrado después de la actualización`);
  }

  // 7. Retornar respuesta completa
  return {
    message: 'Rol actualizado a administrador exitosamente',
    previousRole: previousRole,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      updatedAt: new Date().toISOString(),
    }
  };
}

  async updateProveedorActive(userId: string) {
    // 1. Verificar que el usuario existe
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // 2. Verificar que no sea ya un proveedor
    if (user.role === UserRoles.PROVEEDOR) {
      throw new BadRequestException('El usuario ya tiene rol de proveedor');
    }

    // 3. Verificar que no sea un admin
    if (user.role === UserRoles.ADMIN) {
      throw new BadRequestException('No se puede cambiar el rol de un administrador');
    }

    // 4. Guardar el rol anterior
    const previousRole = user.role;

    // 5. ACTUALIZAR el rol a PROVEEDOR y activar
    await this.userRepository.update(userId, { 
      // role: UserRoles.PROVEEDOR,
      isActive: true,
      verificado: true,
      updatedAt: new Date()
    });

    //  6. Obtener el usuario actualizado desde la BD
    const updatedUser = await this.findById(userId);

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado después de la actualización`);
    }

    // 7. Retornar respuesta completa
    return {
      message: 'Rol actualizado a proveedor exitosamente',
      previousRole: previousRole,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        verificado: updatedUser.verificado,
        updatedAt: new Date().toISOString(),
      }
    };
  }
  
}
