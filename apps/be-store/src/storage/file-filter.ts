import { BadRequestException } from "@nestjs/common";

export function imageFileFilter(_: any, file: Express.Multer.File, cb: Function) {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const mimetypeOk = allowed.test(file.mimetype);
  const extOk = allowed.test((file.originalname.split('.').pop() || '').toLowerCase());
  if (mimetypeOk && extOk) cb(null, true);
  else cb(new BadRequestException('Only image files are allowed'), false);
}
