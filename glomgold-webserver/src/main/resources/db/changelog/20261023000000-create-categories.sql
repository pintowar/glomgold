-- liquibase formatted sql

-- changeset thiago:20261023000000-1
CREATE TABLE "public"."category_groups" ("id" BIGINT NOT NULL, "version" INTEGER NOT NULL, "user_id" BIGINT NOT NULL, "name" VARCHAR(100) NOT NULL, "color" CHAR(7) NOT NULL DEFAULT '#6B7280', "position" INTEGER NOT NULL DEFAULT 0, "is_system" BOOLEAN NOT NULL DEFAULT FALSE, "created_at" TIMESTAMP WITHOUT TIME ZONE, "updated_at" TIMESTAMP WITHOUT TIME ZONE, CONSTRAINT "category_groups_pkey" PRIMARY KEY ("id"));
-- rollback DROP TABLE "public"."category_groups"

-- changeset thiago:20261023000000-2
CREATE SEQUENCE IF NOT EXISTS "public"."category_groups_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;
-- rollback DROP SEQUENCE "public"."category_groups_seq"

-- changeset thiago:20261023000000-3
CREATE INDEX "category_group_user" ON "public"."category_groups"("user_id");
-- rollback DROP INDEX "category_group_user"

-- changeset thiago:20261023000000-4
ALTER TABLE "public"."category_groups" ADD CONSTRAINT "category_group_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
-- rollback ALTER TABLE "public"."category_groups" DROP CONSTRAINT "category_group_user_fk"

-- changeset thiago:20261023000000-5
CREATE TABLE "public"."categories" ("id" BIGINT NOT NULL, "version" INTEGER NOT NULL, "user_id" BIGINT NOT NULL, "group_id" BIGINT, "name" VARCHAR(100) NOT NULL, "color" CHAR(7) NOT NULL DEFAULT '#6B7280', "is_system" BOOLEAN NOT NULL DEFAULT FALSE, "created_at" TIMESTAMP WITHOUT TIME ZONE, "updated_at" TIMESTAMP WITHOUT TIME ZONE, CONSTRAINT "categories_pkey" PRIMARY KEY ("id"));
-- rollback DROP TABLE "public"."categories"

-- changeset thiago:20261023000000-6
CREATE SEQUENCE IF NOT EXISTS "public"."categories_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;
-- rollback DROP SEQUENCE "public"."categories_seq"

-- changeset thiago:20261023000000-7
CREATE INDEX "category_user" ON "public"."categories"("user_id");
-- rollback DROP INDEX "category_user"

-- changeset thiago:20261023000000-8
CREATE INDEX "category_group" ON "public"."categories"("group_id");
-- rollback DROP INDEX "category_group"

-- changeset thiago:20261023000000-9
ALTER TABLE "public"."categories" ADD CONSTRAINT "category_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
-- rollback ALTER TABLE "public"."categories" DROP CONSTRAINT "category_user_fk"

-- changeset thiago:20261023000000-10
ALTER TABLE "public"."categories" ADD CONSTRAINT "category_group_fk" FOREIGN KEY ("group_id") REFERENCES "public"."category_groups" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- rollback ALTER TABLE "public"."categories" DROP CONSTRAINT "category_group_fk"

-- changeset thiago:20261023000000-11
ALTER TABLE "public"."items" ADD COLUMN "category_id" BIGINT;
-- rollback ALTER TABLE "public"."items" DROP COLUMN "category_id"

-- changeset thiago:20261023000000-12
ALTER TABLE "public"."items" ADD CONSTRAINT "item_category_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories" ("id") ON UPDATE NO ACTION ON DELETE SET NULL;
-- rollback ALTER TABLE "public"."items" DROP CONSTRAINT "item_category_fk"

-- changeset thiago:20261023000000-13
CREATE INDEX "item_category" ON "public"."items"("category_id");
-- rollback DROP INDEX "item_category"
