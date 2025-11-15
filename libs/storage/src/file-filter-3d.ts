// File: libs/storage/src/file-filter-3d.ts
import { BadRequestException } from '@nestjs/common';

export function modelFileFilter(_: any, file: Express.Multer.File, cb: Function) {
  const allowedExt = /glb|gltf|usdz|zip|obj|fbx/;
  const mimetypeOk = allowedExt.test((file.mimetype || '').toLowerCase());
  const extOk = allowedExt.test((file.originalname.split('.').pop() || '').toLowerCase());
  if (mimetypeOk || extOk) cb(null, true);
  else cb(new BadRequestException('Only 3D model files are allowed (glb, gltf, usdz, zip, obj, fbx)'), false);
}