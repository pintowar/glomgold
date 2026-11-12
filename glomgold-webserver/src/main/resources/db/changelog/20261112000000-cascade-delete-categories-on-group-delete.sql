-- liquibase formatted sql

-- changeset thiago:20261112000000-1
ALTER TABLE "public"."categories" DROP CONSTRAINT "category_group_fk", ADD CONSTRAINT "category_group_fk" FOREIGN KEY ("group_id") REFERENCES "public"."category_groups" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
-- rollback ALTER TABLE "public"."categories" DROP CONSTRAINT "category_group_fk", ADD CONSTRAINT "category_group_fk" FOREIGN KEY ("group_id") REFERENCES "public"."category_groups" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
