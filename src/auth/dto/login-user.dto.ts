import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class LoginDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'Correo electrónico del usuario',
    type: 'string',
    format: 'email'
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty({ 
    example: 'MyPassword123!',
    description: 'Contraseña del usuario',
    type: 'string'
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}