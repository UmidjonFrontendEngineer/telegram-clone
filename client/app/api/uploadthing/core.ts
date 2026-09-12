import { authOptions } from '@/lib/auth-options'
import { getServerSession } from 'next-auth'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: '4MB' } })
        .middleware(async () => {
            const session = await getServerSession(authOptions)
            
            if (!session || !session.currentUser) {
                throw new UploadThingError('Unauthorized')
            }
            
            return { userId: session.currentUser._id }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log('Upload complete for userId:', metadata.userId)
            console.log('file url', file.url)
            return { url: file.url }
        }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
