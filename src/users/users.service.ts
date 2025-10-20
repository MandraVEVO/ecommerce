import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

    async updateToProveedor(id: string): Promise<User> {
    // 1. Verificar que el usuario existe
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // 2. Actualizar el rol a proveedor
    await this.userRepository.update(id, { 
      role: UserRoles.PROVEEDOR 
    });

    // 3. Obtener y retornar el usuario actualizado
    const updatedUser = await this.findById(id);
    
    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado después de la actualización`);
    }
    
    return updatedUser;
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }

  async updateToAdmin(id: string): Promise<User> {
    // 1. Verificar que el usuario existe
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // 2. Actualizar el rol a admin
    await this.userRepository.update(id, { 
      role: UserRoles.ADMIN 
    });

    // 3. Obtener y retornar el usuario actualizado
    const updatedUser = await this.findById(id);
    
    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado después de la actualización`);
    }
    
    return updatedUser;
  }
  
}
