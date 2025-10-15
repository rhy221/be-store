import { Test, TestingModule } from '@nestjs/testing';
import { DesignerController } from './designer.controller';
import { DesignerService } from './designer.service';

describe('DesignerController', () => {
  let designerController: DesignerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DesignerController],
      providers: [DesignerService],
    }).compile();

    designerController = app.get<DesignerController>(DesignerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(designerController.getHello()).toBe('Hello World!');
    });
  });
});
