import { IsEmail, IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Correo electrónico del usuario',
    type: 'string',
    format: 'email'
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty({ 
    example: 'Juan Pérez González',
    description: 'Nombre completo del usuario',
    minLength: 1,
    type: 'string'
  })
  @IsString()
  @MinLength(1, { message: 'El nombre completo es requerido' })
  fullName: string;

  @ApiProperty({ 
    example: 'MyPassword123!',
    description: 'Contraseña del usuario (debe contener mayúscula, minúscula y número)',
    minLength: 6,
    maxLength: 50,
    type: 'string'
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(50, { message: 'La contraseña no puede tener más de 50 caracteres' })
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, 
    {
      message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número'
    }
  )
  password: string;
}