-- liquibase formatted sql

-- changeset thiago:1759276800000-1
ALTER TABLE "public"."items" ADD COLUMN origin VARCHAR(10) NOT NULL DEFAULT 'MANUAL' CHECK (origin in ('MANUAL', 'CSV', 'OFX'));
-- rollback ALTER TABLE "public"."items" DROP COLUMN "origin";
