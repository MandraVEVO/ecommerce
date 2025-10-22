import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProveedorResponseDto {
  @ApiProperty({ 
    example: 'Gracias por tu comentario. Nos alegra que hayas disfrutado el producto.',
    description: 'Respuesta del proveedor a la reseña'
  })
  @IsString({ message: 'La respuesta debe ser texto' })
  @MaxLength(500, { message: 'La respuesta no puede exceder 500 caracteres' })
  response: string;
}