/*
  Warnings:

  - You are about to drop the column `name` on the `Beach` table. All the data in the column will be lost.
  - Added the required column `place_name` to the `Beach` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Beach" DROP COLUMN "name",
ADD COLUMN     "place_name" TEXT NOT NULL;
