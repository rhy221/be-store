import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@app/database/schemas/user.schema';
import { UserController } from './user.controller';
import { DesignerProfile, DesignerProfileSchema } from '@app/database/schemas/designerProfile.shema';

@Module({
    imports: [MongooseModule.forFeature([{name: User.name, schema: UserSchema},
                                        {name: DesignerProfile.name, schema: DesignerProfileSchema}
    ])],
    providers: [UserService],
    exports: [UserService],
    controllers: [UserController]
})
export class UserModule {}
