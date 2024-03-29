import fs from 'fs';
import os from 'os'

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { GOOGLE_FORM_INVENTORY_FIELDS } from './constants';
import { GoogleSheetRespository } from './integrations/google-sheet';
import { addHours, addYears, isBefore, isValid, parse } from 'date-fns';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import { Asset, PrismaClient } from '@prisma/client'
import { GoogleDriveRespository } from './integrations/google-drive';
import { getSupabase } from './integrations/supabase';
import { createId } from '@paralleldrive/cuid2';
import mime from 'mime-types';
import sharp from 'sharp';
import { pipeline } from 'stream/promises';
import { prisma } from './db';
import path from 'path';


dayjs.extend(customParseFormat)
dayjs.extend(timezone)

let lastSyncedAt: Date | undefined;
let isSyncing = false;

const googleinventoryRepo = new GoogleSheetRespository({
  spreadSheetId: process.env.GOOGLE_INVENTORY_SPREADSHEET_ID!,
});
const googleDriveRepo = new GoogleDriveRespository();

const getField = <T>(record: unknown[], key: keyof typeof GOOGLE_FORM_INVENTORY_FIELDS): T => {
  const field: number | number[] = GOOGLE_FORM_INVENTORY_FIELDS[key] as number | number[];
  const convertValue = (value?: unknown): unknown => {
    switch(key) {
      case 'id':
        return value;
      case 'quantity':
      case 'safe_quantity':
        return value ? parseInt(value as string) : 0;
      default:
        return ((value || '') as string).trim();
      }
  }

  if (Array.isArray(field)) {
    return field.map(f => record[f]).map(convertValue).filter(Boolean).join(', ') as T;
  }
  return convertValue(record[field]) as T;
}

function generateSku(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const syncGoogleInventory = async () => {
  if (isSyncing) {
    return;
  }
  isSyncing = true;

  try {
    console.log('[Sync Google Inventory]: Starting to sync...')
    const records = (await googleinventoryRepo.getAllRows()).reverse();

    const warehouse = await prisma.stockLocation.upsert({
      where: {
        name: '倉庫',
      },
      create: {
        name: '倉庫',
      },
      update: {
        name: '倉庫',
      },
    });
    const existingInventoryItems = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        externalId: true,
      },
      where: {
        externalId: {
          not: {
            equals: null,
          }
        },
      },
    });
    const existingExternalIdsSet = new Set(existingInventoryItems.map((order) => order.externalId!));

    let count = 0;
    let createCount = 0, updateCount = 0, skipCount = 0, deleteCount = 0, errorCount = 0;

    for (const r of records) {
      count++;
      existingExternalIdsSet.delete(getField(r, 'id'));

      try {
        const externalData = JSON.stringify(r);

        const existing = await prisma.inventoryItem.findUnique({
          where: {
            externalId: getField(r, 'id'),
          },
        });
        const shouldUpdate = existing && (existing.externalData !== externalData || (getField(r, 'thumbnail') && !existing?.thumbnailId));

        console.log(`[Sync Google Inventory]: Syncing ${count}/${records.length}... ${shouldUpdate ? 'updating' : existing ? "skipping" : 'creating'}`);

        if (existing) {
          if (!shouldUpdate) {
            skipCount++;
            continue;
          }

          updateCount++;
        } else {
          createCount++;
        }

        let asset: Asset | undefined;
        try {
          if (getField(r, 'thumbnail') && !existing?.thumbnailId) {
            const [file, stream] = await googleDriveRepo.downloadFile(getField(r, 'thumbnail'));
            // Create a temporary file
            const tempFilePath = path.join(os.tmpdir(), `${createId()}.${mime.extension(file.mimeType!)}`);
            const writeStream = fs.createWriteStream(tempFilePath);
            stream.pipe(writeStream);

            await new Promise((resolve, reject) => {
              writeStream.on('finish', resolve);
              writeStream.on('error', reject);
            });

            // Resize the image using Sharp directly from the file
            const resizedStream = fs.createReadStream(tempFilePath).pipe(sharp().resize(500).withMetadata());
            const fileName = `${createId()}.${mime.extension(file.mimeType!)}`;

            await getSupabase().storage.createBucket('admin-assets', { public: true }).catch(() => { });
            await getSupabase().storage
              .from("admin-assets")
              .upload(fileName, stream, { upsert: true, contentType: file.mimeType!, duplex: 'half' });
            const { data: { publicUrl } } = getSupabase().storage.from('admin-assets').getPublicUrl(fileName);

            asset = await prisma.asset.create({
              data: {
                provider: 'supabase',
                bucket: 'admin-assets',
                objectKey: fileName,
                mimeType: file.mimeType!,
                url: publicUrl,
              }
            });

            // Delete the temporary file
            fs.unlink(tempFilePath, (err) => {
              if (err) {
                console.error(`Failed to delete temporary file: ${tempFilePath}`, err);
              }
            });
          }
        } catch (e) {
          // console.error(e);
          console.warn(`[Sync Google Inventory]: Failed to download thumbnail for ${getField(r, 'name')}`);
        }

        const inventoryItem = await prisma.inventoryItem.upsert({
          where: {
            externalId: getField(r, 'id'),
          },
          create: {
            externalId: getField(r, 'id'),
            externalData,
            sku: generateSku(),
            name: getField(r, 'name'),
            category: {
              connectOrCreate: {
                create: {
                  name: getField(r, 'category'),
                },
                where: {
                  id: undefined,
                  name: getField(r, 'category'),
                },
              },
            },
            thumbnail: {
              connect: asset ? {
                id: asset.id,
              } : undefined,
            },
          },
          update: {
            externalData,
            name: getField(r, 'name'),
            category: {
              connectOrCreate: {
                create: {
                  name: getField(r, 'category'),
                },
                where: {
                  id: undefined,
                  name: getField(r, 'category'),
                },
              },
            },
            thumbnail: {
              connect: asset ? {
                id: asset.id,
              } : undefined,
            },
          },
        });

        await prisma.inventoryLevel.deleteMany({
          where: {
            itemId: inventoryItem.id,
          },
        });
        await prisma.inventoryLevel.upsert({
          where: {
            inventoryItemStockLocation: {
              itemId: inventoryItem.id,
              stockLocationId: warehouse.id,
              name: getField(r, 'level_name'),
            }
          },
          create: {
            item: {
              connect: {
                id: inventoryItem.id,
              },
            },
            stockLocation: {
              connect: {
                id: warehouse.id,
              },
            },
            name: getField(r, 'level_name'),
            quantity: getField<number>(r, 'quantity'),
            unit: getField(r, 'unit'),
            safeQuantity: getField<number>(r, 'safe_quantity'),
            isBelowSafeQuantity: getField<number>(r, 'quantity') < getField<number>(r, 'safe_quantity'),
          },
          update: {
            quantity: getField<number>(r, 'quantity'),
            unit: getField(r, 'unit'),
            safeQuantity: getField<number>(r, 'safe_quantity'),
            isBelowSafeQuantity: getField<number>(r, 'quantity') < getField<number>(r, 'safe_quantity'),
          },
        });
      } catch (e) {
        console.error(e);
        errorCount++;
      }
    }

    console.log(`[Sync Google Inventory]: Finished syncing. ${createCount} added, ${updateCount} updated, ${skipCount} skipped, ${deleteCount} deleted.`)
  } finally {
    lastSyncedAt = new Date();
    isSyncing = false;
  }
}