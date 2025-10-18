/**
 * Photo Upload Service
 *
 * Handles offline photo storage and upload queue management.
 * Photos are compressed, stored in IndexedDB, and uploaded when online.
 */

import { db, type PhotoQueueItem } from '@/lib/db'
import { useImageCompression } from '@/hooks/useImageCompression'

/**
 * Add photo to offline queue
 * Compresses photo and stores in IndexedDB for later upload
 */
export async function addPhotoToQueue(
  file: File,
  entityType: 'observations' | 'activities',
  entityId: string
): Promise<{ photoId: string; localUrl: string }> {
  // Generate unique photo ID
  const photoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Compress the image
  const { compressImage } = useImageCompression()
  const { file: compressedFile } = await compressImage(file, {
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
  })

  // Convert to blob
  const blob = new Blob([await compressedFile.arrayBuffer()], { type: compressedFile.type })

  // Create blob URL for display
  const localUrl = URL.createObjectURL(blob)

  // Create photo queue item
  const photoItem: PhotoQueueItem = {
    photoId,
    entityType,
    entityId,
    blob,
    fileName: file.name,
    mimeType: file.type,
    localUrl,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  }

  // Store in IndexedDB
  await db.photoQueue.add(photoItem as PhotoQueueItem)

  console.log(`Photo ${photoId} added to upload queue for ${entityType}:${entityId}`)

  return { photoId, localUrl }
}

/**
 * Get photos for an entity (returns local URLs)
 */
export async function getPhotosForEntity(
  entityType: 'observations' | 'activities',
  entityId: string
): Promise<Array<{ photoId: string; localUrl: string; s3Url?: string; status: string }>> {
  const photos = await db.photoQueue
    .where({ entityType, entityId })
    .toArray()

  return photos.map((photo) => ({
    photoId: photo.photoId,
    localUrl: photo.localUrl,
    s3Url: photo.s3Url,
    status: photo.status,
  }))
}

/**
 * Get pending photo uploads
 */
export async function getPendingPhotos(): Promise<PhotoQueueItem[]> {
  return await db.photoQueue
    .where('status')
    .equals('pending')
    .or('status')
    .equals('error')
    .sortBy('timestamp')
}

/**
 * Upload a single photo to S3
 * This is called by the sync service when online
 */
export async function uploadPhoto(photoItem: PhotoQueueItem): Promise<string> {
  try {
    // Mark as uploading
    if (photoItem.id) {
      await db.photoQueue.update(photoItem.id, { status: 'uploading' })
    }

    // Create FormData for file upload
    const formData = new FormData()
    const file = new File([photoItem.blob], photoItem.fileName, { type: photoItem.mimeType })
    formData.append('photo', file)

    // Upload to backend (which uploads to S3)
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    const s3Url = data.url

    // Update photo queue item with S3 URL
    if (photoItem.id) {
      await db.photoQueue.update(photoItem.id, {
        status: 'uploaded',
        s3Url,
        error: undefined,
      })
    }

    console.log(`Photo ${photoItem.photoId} uploaded successfully to ${s3Url}`)

    return s3Url
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    console.error(`Photo upload failed for ${photoItem.photoId}:`, error)

    // Update with error status
    if (photoItem.id) {
      await db.photoQueue.update(photoItem.id, {
        status: 'error',
        error: errorMessage,
        retryCount: photoItem.retryCount + 1,
      })
    }

    throw error
  }
}

/**
 * Upload all pending photos
 * Returns number of successful uploads and failures
 */
export async function uploadAllPendingPhotos(): Promise<{
  uploaded: number
  failed: number
  errors: Array<{ photoId: string; error: string }>
}> {
  const pendingPhotos = await getPendingPhotos()

  const results = {
    uploaded: 0,
    failed: 0,
    errors: [] as Array<{ photoId: string; error: string }>,
  }

  for (const photo of pendingPhotos) {
    // Skip if retry limit exceeded (max 3 retries)
    if (photo.retryCount >= 3) {
      console.warn(`Photo ${photo.photoId} exceeded retry limit, skipping`)
      continue
    }

    try {
      await uploadPhoto(photo)
      results.uploaded++
    } catch (error) {
      results.failed++
      results.errors.push({
        photoId: photo.photoId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  console.log(`Photo upload batch complete: ${results.uploaded} uploaded, ${results.failed} failed`)

  return results
}

/**
 * Retry failed photo upload
 */
export async function retryPhotoUpload(photoId: string): Promise<void> {
  const photo = await db.photoQueue.where('photoId').equals(photoId).first()

  if (!photo) {
    throw new Error(`Photo ${photoId} not found`)
  }

  if (photo.status === 'uploaded') {
    console.log(`Photo ${photoId} already uploaded`)
    return
  }

  await uploadPhoto(photo)
}

/**
 * Remove photo from queue
 */
export async function removePhotoFromQueue(photoId: string): Promise<void> {
  const photo = await db.photoQueue.where('photoId').equals(photoId).first()

  if (photo) {
    // Revoke blob URL to free memory
    URL.revokeObjectURL(photo.localUrl)

    // Remove from database
    if (photo.id) {
      await db.photoQueue.delete(photo.id)
    }

    console.log(`Photo ${photoId} removed from queue`)
  }
}

/**
 * Clean up uploaded photos
 * Removes photos that have been successfully uploaded
 */
export async function cleanupUploadedPhotos(): Promise<number> {
  const uploadedPhotos = await db.photoQueue.where('status').equals('uploaded').toArray()

  for (const photo of uploadedPhotos) {
    // Revoke blob URL
    URL.revokeObjectURL(photo.localUrl)

    // Remove from database
    if (photo.id) {
      await db.photoQueue.delete(photo.id)
    }
  }

  console.log(`Cleaned up ${uploadedPhotos.length} uploaded photos`)

  return uploadedPhotos.length
}