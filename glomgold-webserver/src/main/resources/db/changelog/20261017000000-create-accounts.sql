-- liquibase formatted sql

-- changeset thiago:20261017000000-1
CREATE TABLE "public"."accounts" ("id" BIGINT NOT NULL, "version" INTEGER NOT NULL, "name" VARCHAR(255) NOT NULL, "currency" VARCHAR(255) NOT NULL, "type" VARCHAR(30) NOT NULL, "user_id" BIGINT NOT NULL, "created_at" TIMESTAMP WITHOUT TIME ZONE, "updated_at" TIMESTAMP WITHOUT TIME ZONE, CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"), CONSTRAINT "account_type_check" CHECK ("type" in ('CHECKING', 'CREDIT_CARD')));
-- rollback DROP TABLE "public"."accounts"

-- changeset thiago:20261017000000-2
CREATE SEQUENCE IF NOT EXISTS "public"."accounts_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1;
-- rollback DROP SEQUENCE "public"."accounts_seq"

-- changeset thiago:20261017000000-3
CREATE INDEX "account_user" ON "public"."accounts"("user_id");
-- rollback DROP INDEX "account_user"

-- changeset thiago:20261017000000-4
ALTER TABLE "public"."accounts" ADD CONSTRAINT "account_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- rollback ALTER TABLE "public"."accounts" DROP CONSTRAINT "account_user_fk"

-- changeset thiago:20261017000000-5
INSERT INTO "public"."accounts" ("id", "version", "name", "currency", "type", "user_id", "created_at", "updated_at")
SELECT nextval('public.accounts_seq'),
       0,
       CASE WHEN replace(lower(coalesce(u."locale", '')), '-', '_') LIKE 'pt%' THEN 'Conta Corrente' ELSE 'Checking' END,
       CASE
           WHEN replace(lower(coalesce(u."locale", '')), '-', '_') LIKE 'pt_br%' THEN 'BRL'
           ELSE 'USD'
       END,
       'CHECKING',
       u."id",
       now(),
       now()
FROM "public"."users" u;
-- rollback DELETE FROM "public"."accounts"

-- changeset thiago:20261017000000-6
ALTER TABLE "public"."items" ADD COLUMN "account_id" BIGINT;
-- rollback ALTER TABLE "public"."items" DROP COLUMN "account_id"

-- changeset thiago:20261017000000-7
UPDATE "public"."items" i SET "account_id" = a."id" FROM "public"."accounts" a WHERE a."user_id" = i."user_id" AND a."type" = 'CHECKING';
-- rollback UPDATE "public"."items" SET "account_id" = NULL

-- changeset thiago:20261017000000-8
ALTER TABLE "public"."items" ALTER COLUMN "account_id" SET NOT NULL;
-- rollback ALTER TABLE "public"."items" ALTER COLUMN "account_id" DROP NOT NULL

-- changeset thiago:20261017000000-9
ALTER TABLE "public"."items" ADD CONSTRAINT "item_account_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
-- rollback ALTER TABLE "public"."items" DROP CONSTRAINT "item_account_fk"

-- changeset thiago:20261017000000-10
CREATE INDEX "item_account" ON "public"."items"("account_id");
-- rollback DROP INDEX "item_account"
