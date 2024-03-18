import { z } from 'zod';

export const apiAssetSchema = z.object({
  id: z.string(),
  provider: z.string(),
  objectKey: z.string(),
  mimeType: z.string(),
  url: z.string(),
  name: z.string().nullish(),
})

export const assetSchema = apiAssetSchema;

export type Asset = z.infer<typeof assetSchema>;

export const apiAssetUploadSchema = z.object({
  id: z.string(),
  url: z.string(),
});

export type AssetUpload = z.infer<typeof apiAssetUploadSchema>;