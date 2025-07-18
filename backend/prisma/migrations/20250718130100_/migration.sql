/*
  Warnings:

  - The `featured_image` column on the `Beach` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Beach" DROP COLUMN "featured_image",
ADD COLUMN     "featured_image" TEXT[];
