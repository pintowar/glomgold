package io.github.pintowar.glomgold.service.parser

import io.github.pintowar.glomgold.dto.CsvColumnMapping
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.model.ItemType
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.maps.shouldContainExactly
import io.kotest.matchers.shouldBe
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth

class CsvImportParserTest :
    StringSpec({

        val parser = CsvImportParser()
        val mapping = CsvColumnMapping(description = "description", value = "value", itemType = "type", date = "date")

        "previews a valid csv with header" {
            val csv =
                """
                description,value,type,date
                Groceries,150.50,EXPENSE,2026-09-05
                Salary,8000,INCOME,2026-09-01
                """.trimIndent()

            val res = parser.preview(csv.toByteArray(), mapping = mapping)

            res.origin shouldBe ItemOrigin.CSV
            res.hasHeader shouldBe true
            res.headers shouldBe listOf("description", "value", "type", "date")
            res.rows.size shouldBe 2
            res.rows.count { it.valid } shouldBe 2
            res.rows[0].description shouldBe "Groceries"
            res.rows[0].value shouldBe BigDecimal("150.50")
            res.rows[0].itemType shouldBe ItemType.EXPENSE
            res.rows[0].date shouldBe LocalDate.of(2026, 9, 5)
            res.rows[0].period shouldBe YearMonth.of(2026, 9)
            res.rows[1].itemType shouldBe ItemType.INCOME
            res.periodGroups shouldContainExactly mapOf("2026-09" to 2)
        }

        "supports two-pass default mapping like the controller" {
            val csv =
                """
                description,value,type,date
                Groceries,150.50,EXPENSE,2026-09-05
                """.trimIndent()

            val first = parser.preview(csv.toByteArray())
            first.rows.all { !it.valid } shouldBe true

            val defaults = parser.defaultMapping(first.headers)
            defaults shouldBe mapping

            val second = parser.preview(csv.toByteArray(), mapping = defaults)
            second.rows.count { it.valid } shouldBe 1
        }

        "defaultMapping detects portuguese and case-insensitive headers" {
            parser.defaultMapping(listOf("Descricao", "VALOR", "Tipo", "DATA")) shouldBe
                CsvColumnMapping(description = "Descricao", value = "VALOR", itemType = "Tipo", date = "DATA")

            parser.defaultMapping(listOf("memo", "amount", "trntype", "dtposted")) shouldBe
                CsvColumnMapping(description = "memo", value = "amount", itemType = "trntype", date = "dtposted")

            parser.defaultMapping(listOf("other", "columns")) shouldBe CsvColumnMapping()
        }

        "supports custom separator and date format" {
            val csv =
                """
                descricao;valor;tipo;data
                Mercado;123,45;DESPESA;05/09/2026
                """.trimIndent()
            val custom = CsvColumnMapping(description = "descricao", value = "valor", itemType = "tipo", date = "data")

            val res = parser.preview(csv.toByteArray(), separator = ';', dateFormat = "dd/MM/yyyy", mapping = custom)

            res.rows.size shouldBe 1
            res.rows[0].valid shouldBe true
            res.rows[0].description shouldBe "Mercado"
            res.rows[0].value shouldBe BigDecimal("123.45")
            res.rows[0].itemType shouldBe ItemType.EXPENSE
            res.rows[0].date shouldBe LocalDate.of(2026, 9, 5)
        }

        "supports files without header via positional mapping" {
            val csv =
                """
                Groceries,150.50,EXPENSE,2026-09-05
                """.trimIndent()
            val positional = CsvColumnMapping(description = "#0", value = "#1", itemType = "#2", date = "#3")

            val res = parser.preview(csv.toByteArray(), hasHeader = false, mapping = positional)

            res.hasHeader shouldBe false
            res.headers shouldBe listOf("#0", "#1", "#2", "#3")
            res.rows.size shouldBe 1
            res.rows[0].valid shouldBe true
            res.rows[0].description shouldBe "Groceries"
        }

        "handles quoted fields, crlf and blank lines" {
            val csv =
                "description,value,type,date\r\n\"Groceries, monthly\",150.50,EXPENSE,2026-09-05\r\n\n" +
                    "\"Say \"\"hi\"\"\",10,EXPENSE,2026-09-06\r\n"

            val res = parser.preview(csv.toByteArray(), mapping = mapping)

            res.rows.size shouldBe 2
            res.rows[0].valid shouldBe true
            res.rows[0].description shouldBe "Groceries, monthly"
            res.rows[1].description shouldBe "Say \"hi\""
        }

        "blanks headers and resolves columns case-insensitively" {
            val csv =
                """
                ,Value,TYPE,Date
                Groceries,150.50,expense,2026-09-05
                """.trimIndent()
            val mixed = CsvColumnMapping(description = "#0", value = "value", itemType = "type", date = "date")

            val res = parser.preview(csv.toByteArray(), mapping = mixed)

            res.headers shouldBe listOf("#0", "Value", "TYPE", "Date")
            res.rows[0].valid shouldBe true
            res.rows[0].itemType shouldBe ItemType.EXPENSE
        }

        "maps income and expense aliases" {
            val cases =
                mapOf(
                    "INCOME" to ItemType.INCOME,
                    "receita" to ItemType.INCOME,
                    "CREDIT" to ItemType.INCOME,
                    "crédito" to ItemType.INCOME,
                    "C" to ItemType.INCOME,
                    "EXPENSE" to ItemType.EXPENSE,
                    "despesa" to ItemType.EXPENSE,
                    "DEBIT" to ItemType.EXPENSE,
                    "débito" to ItemType.EXPENSE,
                    "D" to ItemType.EXPENSE,
                    "unknown" to ItemType.EXPENSE
                )
            cases.forEach { (rawType, expected) ->
                val csv = "description,value,type,date\nItem,10,$rawType,2026-09-05"
                val res = parser.preview(csv.toByteArray(), mapping = mapping)
                res.rows[0].itemType shouldBe expected
            }
        }

        "parses brazilian amounts with thousand separators" {
            val csv = "description,value,type,date\nItem,\"1.234,56\",EXPENSE,2026-09-05"

            val res = parser.preview(csv.toByteArray(), mapping = mapping)

            res.rows[0].valid shouldBe true
            res.rows[0].value shouldBe BigDecimal("1234.56")
        }

        "reports row errors for missing description, invalid value, non-positive value and invalid date" {
            val csv =
                """
                description,value,type,date
                ,10,EXPENSE,2026-09-05
                Item,abc,EXPENSE,2026-09-05
                Item,0,EXPENSE,2026-09-05
                Item,-5,EXPENSE,2026-09-05
                Item,10,EXPENSE,not-a-date
                """.trimIndent()

            val res = parser.preview(csv.toByteArray(), mapping = mapping)

            res.rows.size shouldBe 5
            res.rows.all { !it.valid } shouldBe true
            res.rows[0].error shouldBe "Missing description"
            res.rows[1].error shouldBe "Invalid value: abc"
            res.rows[2].error shouldBe "Value must be greater than zero"
            res.rows[3].error shouldBe "Value must be greater than zero"
            res.rows[4].error shouldBe "Invalid date: not-a-date"
            res.periodGroups shouldBe emptyMap()
        }

        "returns empty response for blank input" {
            val res = parser.preview("  \n\r\n ".toByteArray(), mapping = mapping)

            res.headers shouldBe emptyList()
            res.rows shouldBe emptyList()
            res.periodGroups shouldBe emptyMap()
        }
    })