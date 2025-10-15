import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { Storage } from 'megajs';

@Injectable()
export class StorageService {

    private readonly storage: Storage;

    constructor() {
        // this.storage = new Storage({
        //     email: "ghuy9366@gmail.com",
        //     password:"00024e824E58.",
        //     userAgent:"be-store/1.0"
        // }, error => {
        //     if(error) {
        //         console.error(error.message);
        //     }
        //     else {
        //         console.log("login successful");
        //     }
        // });

    }


    async uploadFile(name: string, path: string) {
        
        const data = await readFile(path);

        await this.storage.upload({name},data, (error, file) => {
            if(error) {
                console.error(error.message);
            }
            else {
                console.log("Upload file successful");
            }
        }).complete;
    }

    async downloadFile() {

    }

    async searchFile() {

    }

    async deleteFile() {

    }

}
