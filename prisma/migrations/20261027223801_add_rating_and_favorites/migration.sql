/*
  Warnings:

  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Anime" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userRating" INTEGER;

-- DropTable
DROP TABLE "Todo";
