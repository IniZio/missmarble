-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "_AssetToOrder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AssetToOrder_AB_unique" ON "_AssetToOrder"("A", "B");

-- CreateIndex
CREATE INDEX "_AssetToOrder_B_index" ON "_AssetToOrder"("B");

-- AddForeignKey
ALTER TABLE "_AssetToOrder" ADD CONSTRAINT "_AssetToOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToOrder" ADD CONSTRAINT "_AssetToOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
