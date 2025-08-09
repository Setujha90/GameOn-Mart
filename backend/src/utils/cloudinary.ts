
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    secure: true,
});

export async function uploadToCloudinary(localFilePath: string) {
    try {
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'avatars',
        });

        fs.unlinkSync(localFilePath);

        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        fs.unlinkSync(localFilePath);
        throw error;
    }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw error;
    }
}
