package io.github.pintowar.glomgold.service.parser

import io.github.pintowar.glomgold.dto.ImportPreviewRow
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth

class ImportParserSupportTest :
    StringSpec({

        "parseAmount handles plain, signed, brazilian and currency values" {
            parseAmount("150.50") shouldBe BigDecimal("150.50")
            parseAmount("-42.50") shouldBe BigDecimal("-42.50")
            parseAmount("1.234,56") shouldBe BigDecimal("1234.56")
            parseAmount("123,45") shouldBe BigDecimal("123.45")
            parseAmount("R$ 1.234,56") shouldBe BigDecimal("1234.56")
            parseAmount("  8000  ") shouldBe BigDecimal("8000")
        }

        "parseAmount returns null for blank or invalid input" {
            parseAmount("") shouldBe null
            parseAmount("   ") shouldBe null
            parseAmount("abc") shouldBe null
            parseAmount("--") shouldBe null
        }

        "parseDate handles custom pattern, iso and common fallbacks" {
            parseDate("2026-09-05", "yyyy-MM-dd") shouldBe LocalDate.of(2026, 9, 5)
            parseDate("05/09/2026", "yyyy-MM-dd") shouldBe LocalDate.of(2026, 9, 5)
            parseDate("20260905", "yyyy-MM-dd") shouldBe LocalDate.of(2026, 9, 5)
            // dd/MM/yyyy wins over MM/dd/yyyy for ambiguous dates
            parseDate("09/05/2026", "yyyy-MM-dd") shouldBe LocalDate.of(2026, 5, 9)
            // MM/dd/yyyy fallback for dates invalid as dd/MM/yyyy
            parseDate("12/31/2026", "yyyy-MM-dd") shouldBe LocalDate.of(2026, 12, 31)
            parseDate("05/09/2026", "dd/MM/yyyy") shouldBe LocalDate.of(2026, 9, 5)
        }

        "parseDate handles OFX datetimes and rejects invalid input" {
            parseDate("20260930120000", "yyyyMMdd") shouldBe LocalDate.of(2026, 9, 30)
            parseDate("", "yyyy-MM-dd") shouldBe null
            parseDate("   ", "yyyy-MM-dd") shouldBe null
            parseDate("not-a-date", "yyyy-MM-dd") shouldBe null
        }

        "groupPeriods counts only valid rows with a period" {
            val rows =
                listOf(
                    ImportPreviewRow(description = "a", valid = true, period = YearMonth.of(2026, 9)),
                    ImportPreviewRow(description = "b", valid = true, period = YearMonth.of(2026, 9)),
                    ImportPreviewRow(description = "c", valid = true, period = YearMonth.of(2026, 10)),
                    ImportPreviewRow(description = "d", valid = false, period = YearMonth.of(2026, 10)),
                    ImportPreviewRow(description = "e", valid = true, period = null),
                    ImportPreviewRow(error = "boom")
                )

            groupPeriods(rows) shouldBe mapOf("2026-09" to 2, "2026-10" to 1)
            groupPeriods(emptyList()) shouldBe emptyMap()
        }
    })