package com.github.pintowar.dto

import com.github.pintowar.model.Item
import io.micronaut.core.annotation.Introspected
import io.micronaut.data.annotation.TypeDef
import io.micronaut.data.model.DataType
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics
import org.apache.commons.math3.stat.regression.SimpleRegression
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.*

@Introspected
data class ItemSummary(
    @field:TypeDef(type = DataType.TIMESTAMP) val period: YearMonth,
    val description: String,
    val value: BigDecimal
)

@Introspected
data class ItemBody(
    val year: Int,
    val month: Int,
    val description: String,
    val value: BigDecimal
) {
    fun toItem(userId: Long) = Item(
        description,
        value,
        Currency.getInstance("BRL"),
        YearMonth.of(year, month),
        userId
    )
}

@Introspected
data class PanelInfo(
    val items: List<Item>,
    val stats: List<ItemSummary>,
    val total: BigDecimal,
    val diff: BigDecimal,
)

class AnnualReport(year: Int, summary: List<ItemSummary>) {
    private val table = summary
        .groupingBy { it.period to it.description }
        .fold(BigDecimal.ZERO) { acc, it -> acc + it.value }

    val columns: List<YearMonth> = (1..12).map { YearMonth.of(year, it) }
    val rowIndex: Set<String> = table.keys.map { (_, desc) -> desc }.toSortedSet()

    private fun getCell(description: String, period: YearMonth): BigDecimal? = table[period to description]

    private fun sumAll(values: List<BigDecimal?>): BigDecimal =
        values.fold(BigDecimal.ZERO) { acc, v -> acc + (v ?: BigDecimal.ZERO) }

    fun getRow(description: String) = columns.map { getCell(description, it) }

    fun getCol(period: YearMonth) = rowIndex.map { getCell(it, period) }

    fun rowSummary() = columns.map { getCol(it).let(::sumAll) }

    fun colSummary() = rowIndex.map { getRow(it).let(::sumAll) }

    fun calcTrend(values: List<BigDecimal>) = if (values.count { it != BigDecimal.ZERO } > 2)
        simpleRegression(values) else mean(values)

    fun mean(values: List<BigDecimal>) = DescriptiveStatistics().let { stats ->
        values.forEach { if (it != BigDecimal.ZERO) stats.addValue(it.toDouble()) }
        values.indices.map { stats.mean.toBigDecimal().setScale(2, RoundingMode.HALF_DOWN) }
    }

    fun simpleRegression(values: List<BigDecimal>) = SimpleRegression().let { reg ->
        values.forEachIndexed { idx, it -> if (it != BigDecimal.ZERO) reg.addData(idx.toDouble(), it.toDouble()) }
        values.indices.map { reg.predict(it.toDouble()).toBigDecimal().setScale(2, RoundingMode.HALF_DOWN) }
    }

    fun formatTable(formatter: DateTimeFormatter): Map<String, Any> {
        val cols = columns.map(formatter::format)
        val colSum = rowIndex.zip(colSummary()).toMap()
        val table = rowIndex.map { desc ->
            mapOf("Description" to desc) + columns.associate { it.format(formatter) to table[it to desc] } +
                    mapOf("Total" to colSum[desc])
        }

        val rowSum = rowSummary()
        return mapOf(
            "data" to table, //+ rowSummary,
            "columns" to (listOf("Description") + cols + listOf("Total")),
            "total" to rowSum.reduce { acc, it -> acc + it },
            "rowSummary" to rowSum,
            "rowTrend" to calcTrend(rowSum),
            "colSummary" to colSum.values
        )
    }
}