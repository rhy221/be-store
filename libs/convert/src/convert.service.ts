import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as path from 'path';
import { lookup } from 'mime-types';
const convert = require('fbx2gltf');

@Injectable()
export class ConvertService {

    async convertFbxToGltf(inputPath: string, outputPath?: string) {
       
       return convert(inputPath, outputPath, ['--khr-materials-unlit']);
  }

  async getFileFromPath(filePath: string) {
  
  const fileBuffer = await fs.readFile(filePath);
  const fileName = path.basename(filePath);
  const mimeType = lookup(filePath) || 'application/octet-stream';

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: fileName,
    encoding: '7bit',
    mimetype: mimeType,
    buffer: fileBuffer,
    size: fileBuffer.length,
    stream: null as any,
    destination: '',
    filename: fileName,
    path: filePath,
  };

  return mockFile
}

}
