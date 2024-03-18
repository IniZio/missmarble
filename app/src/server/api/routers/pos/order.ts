import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from '@trpc/server';
import { type PrismaClient } from '@prisma/client';

const orderAssetInput = z.object({
  provider: z.string(),
  bucket: z.string(),
  objectKey: z.string(),
  mimeType: z.string(),
  url: z.string(),
  name: z.string(),
});

export function findOrders(ctx: {prisma: PrismaClient}, input: {
  dateStart: Date,
  dateEnd: Date,
  keyword?: string,
}) {
  return ctx.prisma.order.findMany({
    orderBy: {
      deliveryDate: 'asc',
    },
    where: {
      deliveryDate: {
        gte: input.dateStart,
        lte: input.dateEnd,
      },
      OR: [
        {
          phoneNumber: {
            contains: input.keyword,
            mode: 'insensitive'
          },
        },
        {
          name: {
            contains: input.keyword,
            mode: 'insensitive'
          },
        },
        {
          socialHandle: {
            contains: input.keyword,
            mode: 'insensitive',
          },
        },
        // {
        //   shippingAddress: {
        //     name: {
        //       contains: input.keyword,
        //       mode: 'insensitive',
        //     }
        //   },
        //   billingAddress: {
        //     name: {
        //       contains: input.keyword,
        //       mode: 'insensitive',
        //     }
        //   },
        // },
      ],
    },
    include: {
      currency: true,
      assets: true,
      items: {
        include: {
          product: {
            include: {
              name: true,
              gallery: true,
            },
          },
          productFieldValues: {
            include: {
              field: {
                include: {
                  name: true,
                }
              },
              fieldOption: {
                include: {
                  name: true,
                }
              },
              fieldOptionAsset: true,
            }
          },
        },
      },
      billingAddress: true,
      shippingAddress: true,
      shippingOption: {
        include: {
          name: true,
          price: true,
        }
      },
    },
  });
}

export const orderRouter = createTRPCRouter({
  detail: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const item = await ctx.prisma.order.findUnique({
      where: {
        id: input,
      },
      include: {
        currency: true,
        items: {
          include: {
            product: {
              include: {
                name: true,
                gallery: true,
              },
            },
            productFieldValues: {
              include: {
                field: {
                  include: {
                    name: true,
                  }
                },
                fieldOption: {
                  include: {
                    name: true,
                  }
                },
                fieldOptionAsset: true,
              }
            },
          },
        },
        billingAddress: true,
        shippingAddress: true,
        shippingOption: {
          include: {
            name: true,
            price: true,
          }
        },
      },
    });

    if (!item) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    return item;
  }),
  list: publicProcedure.input(
    z.object({
      dateStart: z.date(),
      dateEnd: z.date(),
      keyword: z.string().default(''),
    }),
  ).query(async ({ input, ctx }) => {
    const items = await findOrders(ctx, input);

    return items;
  }),
  assignAssets: publicProcedure.input(z.object({
    orderId: z.string(),
    assets: z.array(orderAssetInput),
  })).mutation(async ({ input, ctx }) => {
    const order = await ctx.prisma.order.findUnique({
      where: {
        id: input.orderId,
      },
      include: {
        assets: true,
      },
    });

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    await ctx.prisma.order.update({
      where: {
        id: input.orderId,
      },
      data: {
        assets: {
          create: input.assets.map((asset) => ({
            provider: asset.provider,
            bucket: asset.bucket,
            name: asset.name,
            objectKey: asset.objectKey,
            mimeType: asset.mimeType,
            url: asset.url,
          })),
        },
      },
    });
  }),
});
