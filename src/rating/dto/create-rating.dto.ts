import { IsInt, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ 
    example: 5,
    description: 'Calificación de 1 a 5 estrellas',
    minimum: 1,
    maximum: 5
  })
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  rating: number;

  @ApiPropertyOptional({ 
    example: 'Excelente producto, muy buena calidad',
    description: 'Reseña o comentario del producto'
  })
  @IsOptional()
  @IsString({ message: 'La reseña debe ser texto' })
  @MaxLength(1000, { message: 'La reseña no puede exceder 1000 caracteres' })
  review?: string;
}
