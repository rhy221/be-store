import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(7)
    password: string;

    @IsString()
    @IsOptional()
    origin?: string;

}

export class RegisterDto {

    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    @IsOptional()
    origin?: string;
}

export class ResendEmailVerificationDto {
  
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    origin?: string;
}

export class ForgotPasswordDto {
 
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    origin?: string;
}

export class ResetPasswordDto {
  
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    origin?: string;

}

export class VerifyMailDto {

    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @IsOptional()
    origin?: string;
}