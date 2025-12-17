import { GoogleGenAI } from '@google/genai';
import { client } from '@gradio/client';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Replicate from 'replicate';

@Injectable()
export class TryonService {
private replicate: Replicate;

  constructor(private configService: ConfigService) {
    this.replicate = new Replicate({
      auth: this.configService.get<string>('REPLICATE_API_TOKEN'),
    });
  }

  private mapCategoryToReplicate(slug: string): string {
    switch (slug) {
      case 'tops':
        return 'upper_body';
      case 'bottoms':
        return 'lower_body';
      case 'full-body':
        return 'dresses';
      case 'footwear':
      case 'accessories':
        // Throw internal error code
        throw new Error('UNSUPPORTED_CATEGORY');
      default:
        return 'upper_body';
    }
  }

  async generateTryOn(
    personFile: Express.Multer.File, 
    garmentUrl: string, 
    categorySlug: string 
  ) {
    try {
      // 1. Validate Category
      let modelCategory;
      try {
        modelCategory = this.mapCategoryToReplicate(categorySlug);
      } catch (e) {
         if (e.message === 'UNSUPPORTED_CATEGORY') {
            // ENGLISH ERROR MESSAGE
            throw new HttpException(
              'Virtual try-on is not currently supported for Footwear or Accessories.', 
              HttpStatus.BAD_REQUEST
            );
         }
      }

      // 2. Validate Image & URL
      const mimeType = personFile.mimetype;
      const base64Image = personFile.buffer.toString('base64');
      const humanImageUri = `data:${mimeType};base64,${base64Image}`;

      if (!garmentUrl.startsWith('http')) {
         // ENGLISH ERROR MESSAGE
         throw new Error('Garment image must be a valid public URL (http/https).');
      }

      // 3. Call Replicate (Standard yisol model)
      const output = await this.replicate.run(
        "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
        {
          input: {
            human_img: humanImageUri, 
            garm_img: garmentUrl,     
            garment_des: "clothing",  
            category: modelCategory, 
            steps: 30,                
            crop: false,              
            seed: 42                  
          }
        }
      );

      return { imageUrl: String(output) };

    } catch (error) {
      console.error('Tryon Service Error:', error);
      
      if (error instanceof HttpException) throw error;

      // Handle Replicate specific errors (English)
      if (error.message?.includes('payment') || error.message?.includes('quota')) {
         throw new HttpException(
           'Replicate API quota exceeded or payment required.', 
           HttpStatus.PAYMENT_REQUIRED
         );
      }

      // Generic Error (English)
      throw new HttpException(
        'AI processing failed: ' + (error.message || 'Unknown error'), 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Helper tải ảnh từ URL
  private async fetchImageBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Cannot fetch garment image from URL`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
