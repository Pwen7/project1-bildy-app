import { v2 as cloudinary } from 'cloudinary'
import { createRequire } from 'module'
import { Readable } from 'stream'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadToCloud = async (file, opts = {}) => {
  let buffer = file.buffer

  if (file.mimetype.startsWith('image/')) {
    buffer = await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'bildy', resource_type: 'auto', ...opts },
      (error, result) => {
        if (error) { return reject(error) }
        resolve(result.secure_url)
      }
    )
    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(stream)
  })
}
