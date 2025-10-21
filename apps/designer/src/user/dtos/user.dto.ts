import { IsEmail, IsString, MinLength } from "class-validator";

export class UserDto {
    
    // @IsString()
    // _id: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    role = "customer";
}