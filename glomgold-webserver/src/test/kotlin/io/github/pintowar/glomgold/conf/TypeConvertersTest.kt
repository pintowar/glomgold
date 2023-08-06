package io.github.pintowar.glomgold.conf

import io.kotest.core.spec.style.StringSpec
import io.kotest.data.forAll
import io.kotest.data.row
import io.kotest.matchers.shouldBe
import java.time.Instant
import java.time.LocalDateTime
import java.time.YearMonth
import java.time.ZoneId

class TypeConvertersTest : StringSpec({

    val conversor = TypeConverters()

    "periodDateTypeConverter" {
        val converter = conversor.periodDateTypeConverter()

        forAll(
            row(2022, 2, "2022-02-01T00:00:00.000"),
            row(2020, 5, "2020-05-01T00:00:00.000"),
            row(2021, 1, "2021-01-01T00:00:00.000")
        ) { year, month, instant ->
            val res = converter.convert(YearMonth.of(year, month), Instant::class.java).get()
            val expected = LocalDateTime.parse(instant).atZone(ZoneId.systemDefault()).toInstant()
            res shouldBe expected
        }
    }

    "datePeriodTypeConverter" {
        val converter = conversor.datePeriodTypeConverter()

        forAll(
            row("2022-02-01T00:00:00.000", 2022, 2),
            row("2020-05-01T00:00:00.000", 2020, 5),
            row("2021-01-01T00:00:00.000", 2021, 1)
        ) { instant, year, month ->
            val expected = LocalDateTime.parse(instant).atZone(ZoneId.systemDefault()).toInstant()
            val res = converter.convert(expected, YearMonth::class.java).get()
            res shouldBe YearMonth.of(year, month)
        }
    }
})