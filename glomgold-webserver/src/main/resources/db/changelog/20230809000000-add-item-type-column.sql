-- liquibase formatted sql

-- changeset thiago:1691550000000-1
ALTER TABLE "public"."items" ADD COLUMN item_type VARCHAR(30) NOT NULL DEFAULT 'EXPENSE' CHECK (item_type in ('EXPENSE', 'INCOME'));
-- rollback ALTER TABLE "public"."items" DROP COLUMN "item_type";
