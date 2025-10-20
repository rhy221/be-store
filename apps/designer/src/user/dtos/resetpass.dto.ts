import { IsString, MinLength } from "class-validator";

export class ResetpassDto {

    @IsString()
    @MinLength(8)
    password: string;
}