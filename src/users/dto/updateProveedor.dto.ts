import { IsString, IsOptional, IsEnum, IsBoolean, MinLength, IsPhoneNumber, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MetodoPago } from '../../common/enums/metodo-pago.enum';

export class UpdateProveedorDto {


  @ApiProperty({
    example: 'proveedor@example.com',
    description: 'Correo electrónico del proveedor',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Juan Pérez González',
    description: 'Nombre completo del proveedor',
    required: false 
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ 
    example: 'Empresa ABC S.A.',
    description: 'Nombre de la empresa o negocio',
    required: false 
  })
  @IsOptional()
  @IsString() 
  nombreEmpresa?: string;

  @ApiProperty({ 
    example: 'Av. Principal 123, Santiago, Chile',
    description: 'Dirección física del negocio',
    required: false 
  })
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiProperty({ 
    example: 'Venta de productos tecnológicos',
    description: 'Giro o rubro del negocio',
    required: false 
  })
  @IsOptional()
  @IsString()
  giro?: string;

  @ApiProperty({ 
    example: 'Distribuidor oficial de productos de tecnología con más de 10 años de experiencia',
    description: 'Descripción detallada del negocio',
    required: false 
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ 
    example: '+56912345678',
    description: 'Número de teléfono de contacto',
    required: false 
  })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ 
    example: '+56912345678',
    description: 'Número de WhatsApp para contacto',
    required: false 
  })
  @IsOptional()
  @IsString()
  wasap?: string;

  @ApiProperty({ 
    example: 'Lunes a Viernes: 9:00 - 18:00, Sábados: 9:00 - 13:00',
    description: 'Horario de atención del negocio',
    required: false 
  })
  @IsOptional()
  @IsString()
  horario?: string;

  @ApiProperty({ 
    example: 'transferencia',
    enum: MetodoPago,
    description: 'Método de pago preferido: cuerpo, transferencia, ambos',
    required: false 
  })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

    @ApiProperty({
    example: '10000',
    description: 'Monto mínimo de compra requerido',
    required: false
  })
  @IsOptional()
  @IsString()
  compraMinima?: string;
}