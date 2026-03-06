-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "genEdCategory" TEXT,
ADD COLUMN     "isGenEd" BOOLEAN NOT NULL DEFAULT false;
