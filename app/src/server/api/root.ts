import { createTRPCRouter } from "@/server/api/trpc";
import { productRouter } from './routers/product';
import { assetRouter } from './routers/asset';
import { cartRouter } from './routers/cart';
import { shippingOptionsRouter } from './routers/shippingOptions';
import { paymentOptionsRouter } from './routers/paymentOptions';
import { adminRouter } from './routers/admin';
import { posRouter } from './routers/pos';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  product: productRouter,
  asset: assetRouter,
  cart: cartRouter,
  shippingOptions: shippingOptionsRouter,
  paymentOptions: paymentOptionsRouter,
  admin: adminRouter,
  pos: posRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
