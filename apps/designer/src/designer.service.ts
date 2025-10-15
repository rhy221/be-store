import { Injectable } from '@nestjs/common';

@Injectable()
export class DesignerService {
  getHello(): string {
    return 'Hello World!';
  }
}
