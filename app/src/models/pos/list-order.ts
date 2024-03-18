import { z } from 'zod';
import { lineItemSchema } from '../cart';
import { apiShippingOptionSchema } from '../shipping';
import { ProductFieldType, apiProductFieldOptionSchema, productFieldSchema } from '../product';
import { assetSchema } from '../asset';
import { translationSchema } from '../translation';

export enum OrderFulfillmentStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
}

export enum OrderPaymentStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
}

export const addresssSchema = z.object({
  name: z.string(),
  address1: z.string(),
  address2: z.string(),
})

// export const currencySchema =

export const orderFieldSchema = z.object({
  id: z.string().optional(),
  alias: z.string(),
  type: z.nativeEnum(ProductFieldType),
  name: translationSchema,
});

export const orderFieldValueSchema = z.object({
  field: orderFieldSchema,
  fieldValue: z.string().nullish(),
  fieldOption: apiProductFieldOptionSchema.nullish(),
  fieldOptionAsset: assetSchema.nullish(),
})

export const orderLineItemSchema = z.object({
  quantity: z.number().int().positive(),
  product: z.object({
    id: z.string(),
    name: translationSchema,
    // gallery: z.array(assetSchema).nullish(),
  }).nullish(),
  productFieldValues: z.array(orderFieldValueSchema),
  subtotal: z.number(),
  shippingTotal: z.number(),
  total: z.number(),
})


export const listOrderSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  items: z.array(orderLineItemSchema),
  name: z.string(),
  phoneNumber: z.string(),
  socialHandle: z.string().nullish(),
  socialChannel: z.string().nullish(),
  billingAddress: addresssSchema.nullish(),
  shippingAddress: addresssSchema,
  // currency: currencySchema,
  shippingOption: apiShippingOptionSchema,
  deliveryDate: z.coerce.date(),
  remark: z.string().nullish(),
  paymentStatus: z.nativeEnum(OrderPaymentStatus),
  fulfillmentStatus: z.nativeEnum(OrderFulfillmentStatus),

  subtotal: z.number(),
  discountTotal: z.number(),
  total: z.number(),
  shippingTotal: z.number(),

  assets: z.array(assetSchema),
})

export type ListOrder = z.infer<typeof listOrderSchema>