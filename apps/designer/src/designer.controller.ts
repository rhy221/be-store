import { Controller, Get } from '@nestjs/common';
import { DesignerService } from './designer.service';

@Controller()
export class DesignerController {
  constructor(private readonly designerService: DesignerService) {}

  @Get()
  getHello(): string {
    return this.designerService.getHello();
  }
}
