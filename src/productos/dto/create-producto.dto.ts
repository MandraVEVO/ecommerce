import { IsString, IsNumber, IsOptional, IsBoolean, IsPositive, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateProductoDto {
  @ApiProperty({ 
    example: 'iPhone 15 Pro',
    description: 'Nombre del producto'
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  @Transform(({ value }) => value?.trim()) // ✅ Limpiar espacios
  nombre: string;

  @ApiPropertyOptional({ 
    example: 'iPhone 15 Pro 256GB - Color Titanio Natural',
    description: 'Descripción detallada del producto'
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @ApiProperty({ 
    example: 899990,
    description: 'Precio del producto en pesos chilenos'
  })
  @Type(() => Number) // ✅ IMPORTANTE: Convertir string a número
  @Transform(({ value }) => {
    // ✅ Manejar conversión desde FormData (viene como string)
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Min(1, { message: 'El precio mínimo es 1' })
  precio: number;

  @ApiPropertyOptional({ 
    example: true,
    description: 'Disponibilidad del producto',
    default: true
  })
  @IsOptional()
  @Transform(({ value }) => {
    // ✅ Convertir string a boolean desde FormData
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  })
  @IsBoolean({ message: 'isAvailable debe ser true o false' })
  isAvailable?: boolean;
}