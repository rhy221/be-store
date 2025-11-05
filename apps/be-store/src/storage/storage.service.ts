import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { Storage } from 'megajs';

@Injectable()
export class StorageService {

    private readonly storage: Storage;

    constructor() {
       

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
