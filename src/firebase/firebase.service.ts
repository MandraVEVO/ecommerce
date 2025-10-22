import { Injectable, BadRequestException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  thumbnail?: boolean;
}

const DEFAULT_OPTIMIZATION: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'webp',
  thumbnail: false,
};

@Injectable()
export class FirebaseService implements OnModuleInit {
  private storage: admin.storage.Storage;
  private bucket: ReturnType<admin.storage.Storage['bucket']>;

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (!admin.apps.length) {
      try {
        const possiblePaths = [
          path.join(process.cwd(), 'ecommerce-neg-firebase.json'),
          path.join(process.cwd(), 'firebase-credentials.json'),
          path.join(process.cwd(), 'src', 'config', 'firebase-credentials.json'),
        ];

        let serviceAccountPath: string | null = null;

        console.log('\n🔍 Buscando credenciales de Firebase...');
        
        for (const pathToCheck of possiblePaths) {
          if (fs.existsSync(pathToCheck)) {
            serviceAccountPath = pathToCheck;
            console.log(` Encontrado: ${pathToCheck}`);
            break;
          }
        }

        if (!serviceAccountPath) {
          throw new Error('Archivo de credenciales no encontrado');
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Formato de credenciales inválido');
        }

        //  USAR EL NUEVO FORMATO DE BUCKET
        const storageBucket = `${serviceAccount.project_id}.firebasestorage.app`;

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          storageBucket: storageBucket, // Usar .firebasestorage.app
        });

        console.log(`Firebase Admin SDK inicializado`);
        console.log(`Project ID: ${serviceAccount.project_id}`);
        console.log(`Storage Bucket: ${storageBucket}\n`);
      } catch (error: any) {
        console.error('❌ Error al inicializar Firebase:', error.message);
        throw error;
      }
    }

    this.storage = admin.storage();
    this.bucket = this.storage.bucket();

    // Verificar bucket
    this.verifyBucket();
  }

  private async verifyBucket() {
    try {
      const [exists] = await this.bucket.exists();
      
      if (!exists) {
        console.error(`\n❌ BUCKET NO EXISTE: ${this.bucket.name}\n`);
        console.error(`⚠️  Ve a Firebase Console y activa Storage\n`);
        throw new Error(`Bucket no existe: ${this.bucket.name}`);
      } else {
        console.log(`✅ Bucket verificado: ${this.bucket.name}\n`);
      }
    } catch (error: any) {
      console.error(`⚠️  Error al verificar bucket: ${error.message}\n`);
    }
  }

  private async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = DEFAULT_OPTIMIZATION
  ): Promise<{ buffer: Buffer; format: string; metadata: any }> {
    try {
      const opts = { ...DEFAULT_OPTIMIZATION, ...options };
      
      console.log(`\nProcesando imagen...`);
      const metadata = await sharp(buffer).metadata();
      
      console.log(`   Original: ${metadata.width}x${metadata.height}, ${(buffer.length / 1024).toFixed(2)} KB`);

      let sharpInstance = sharp(buffer);

      if (metadata.width && metadata.height) {
        if (metadata.width > opts.maxWidth! || metadata.height > opts.maxHeight!) {
          sharpInstance = sharpInstance.resize(opts.maxWidth, opts.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
      }

      sharpInstance = sharpInstance.rotate();

      let optimizedBuffer: Buffer;
      let finalFormat = opts.format!;

      switch (opts.format) {
        case 'webp':
          optimizedBuffer = await sharpInstance.webp({ quality: opts.quality, effort: 6 }).toBuffer();
          break;
        case 'jpeg':
          optimizedBuffer = await sharpInstance.jpeg({ quality: opts.quality, progressive: true }).toBuffer();
          break;
        case 'png':
          optimizedBuffer = await sharpInstance.png({ quality: opts.quality, compressionLevel: 9 }).toBuffer();
          break;
        default:
          optimizedBuffer = buffer;
      }

      const optimizedMetadata = await sharp(optimizedBuffer).metadata();
      
      console.log(`   Optimizada: ${optimizedMetadata.width}x${optimizedMetadata.height}, ${(optimizedBuffer.length / 1024).toFixed(2)} KB`);
      console.log(`   Reducción: ${((1 - optimizedBuffer.length / buffer.length) * 100).toFixed(1)}%`);

      return { buffer: optimizedBuffer, format: finalFormat, metadata: optimizedMetadata };
    } catch (error: any) {
      console.error('❌ Error al optimizar:', error.message);
      throw new InternalServerErrorException('Error al procesar la imagen');
    }
  }

  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(300, 300, { fit: 'cover', position: 'center' })
        .webp({ quality: 70 })
        .toBuffer();
    } catch (error: any) {
      console.error('❌ Error al crear thumbnail:', error.message);
      throw new InternalServerErrorException('Error al crear miniatura');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'productos',
    options: ImageOptimizationOptions = {}
  ): Promise<{ url: string; thumbnailUrl?: string }> {
    console.log('\n Subiendo imagen...');
    
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    console.log(`   Archivo: ${file.originalname}`);
    console.log(`   Tipo: ${file.mimetype}`);
    console.log(`   Tamaño: ${(file.size / 1024).toFixed(2)} KB`);

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo imágenes (JPEG, PNG, WEBP, GIF)');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Imagen no debe superar 10MB');
    }

    try {
      const timestamp = Date.now();
      const uniqueId = uuidv4();

      const { buffer: optimizedBuffer, format } = await this.optimizeImage(file.buffer, options);
      
      const fileName = `${folder}/${uniqueId}-${timestamp}.${format}`;
      console.log(`\n Subiendo a: ${fileName}`);
      
      const fileUpload = this.bucket.file(fileName);

      await fileUpload.save(optimizedBuffer, {
        metadata: {
          contentType: `image/${format}`,
          metadata: {
            firebaseStorageDownloadTokens: uniqueId,
            uploadedAt: new Date().toISOString(),
            originalName: file.originalname,
            optimized: 'true',
          },
        },
        public: true,
        validation: 'md5',
      });

      console.log(`✅ Imagen subida exitosamente`);

      //  URL con el nuevo formato de bucket
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

      let thumbnailUrl: string | undefined;
      if (options.thumbnail !== false) {
        try {
          console.log(`Creando thumbnail...`);
          const thumbnailBuffer = await this.createThumbnail(optimizedBuffer);
          const thumbnailFileName = `${folder}/thumbnails/${uniqueId}-${timestamp}.webp`;
          const thumbnailUpload = this.bucket.file(thumbnailFileName);

          await thumbnailUpload.save(thumbnailBuffer, {
            metadata: {
              contentType: 'image/webp',
              metadata: { 
                firebaseStorageDownloadTokens: uuidv4(), 
                uploadedAt: new Date().toISOString(), 
                isThumbnail: 'true' 
              },
            },
            public: true,
          });

          thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodeURIComponent(thumbnailFileName)}?alt=media`;
          console.log(` Thumbnail creado\n`);
        } catch (thumbError: any) {
          console.warn(`⚠️  No se pudo crear thumbnail: ${thumbError.message}`);
        }
      }

      return { url: publicUrl, thumbnailUrl };
    } catch (error: any) {
      console.error('\n❌ ERROR AL SUBIR:');
      console.error(`   ${error.message}\n`);
      
      if (error.code === 404) {
        throw new InternalServerErrorException('Bucket no existe. Activa Storage en Firebase Console.');
      }
      if (error.code === 403) {
        throw new InternalServerErrorException('Permiso denegado. Verifica reglas de seguridad.');
      }
      
      throw new InternalServerErrorException(`Error al subir: ${error.message}`);
    }
  }

  async deleteImage(imageUrl: string, deleteThumbnail: boolean = true): Promise<void> {
    if (!imageUrl) return;
    try {
      const fileName = this.extractFileNameFromUrl(imageUrl);
      if (fileName) {
        const file = this.bucket.file(fileName);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Imagen eliminada: ${fileName}`);
        }
        if (deleteThumbnail) {
          const thumbnailFileName = fileName.replace(/^productos\//, 'productos/thumbnails/');
          const thumbnailFile = this.bucket.file(thumbnailFileName);
          const [thumbnailExists] = await thumbnailFile.exists();
          if (thumbnailExists) {
            await thumbnailFile.delete();
          }
        }
      }
    } catch (error: any) {
      console.error(' Error al eliminar:', error.message);
    }
  }

  async updateImage(
    oldImageUrl: string | null,
    newFile: Express.Multer.File,
    folder: string = 'productos',
    options: ImageOptimizationOptions = {}
  ): Promise<{ url: string; thumbnailUrl?: string }> {
    const result = await this.uploadImage(newFile, folder, options);
    if (oldImageUrl) {
      await this.deleteImage(oldImageUrl);
    }
    return result;
  }

  private extractFileNameFromUrl(url: string): string | null {
    try {
      // Manejar ambos formatos de URL
      // Formato antiguo: https://storage.googleapis.com/bucket/file
      // Formato nuevo: https://firebasestorage.googleapis.com/v0/b/bucket/o/file?alt=media
      
      if (url.includes('firebasestorage.googleapis.com')) {
        const match = url.match(/\/o\/(.+?)\?/);
        return match ? decodeURIComponent(match[1]) : null;
      } else {
        const bucketName = this.bucket.name;
        const baseUrl = `https://storage.googleapis.com/${bucketName}/`;
        if (!url.startsWith(baseUrl)) return null;
        return decodeURIComponent(url.replace(baseUrl, ''));
      }
    } catch (error) {
      return null;
    }
  }
}