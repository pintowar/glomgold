package com.github.pintowar.service

import com.github.pintowar.dto.PanelAnnualReport
import com.github.pintowar.dto.PanelInfo
import com.github.pintowar.repo.ItemRepository
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.toList
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics
import org.apache.commons.math3.stat.regression.SimpleRegression
import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode
import java.time.YearMonth
import java.time.format.DateTimeFormatter

@Singleton
class PanelService(private val itemRepository: ItemRepository) {

    private val formatter = DateTimeFormatter.ofPattern("MMM")

    suspend fun annualReport(userId: Long, year: Int): PanelAnnualReport {
        val summary = itemRepository.yearSummary(year, userId).toList()
        val table = summary
            .groupingBy { it.period to it.description }
            .fold(BigDecimal.ZERO) { acc, it -> acc + it.value }

        val columns: List<YearMonth> = (1..12).map { YearMonth.of(year, it) }
        val rowIndex: Set<String> = table.keys.map { (_, desc) -> desc }.toSortedSet()
        val data = rowIndex.map { desc -> columns.map { table[it to desc] } }

        val rowSummary = columns.indices.map { col ->
            rowIndex.indices.map { row -> data[row][col] }.reduce(::nullableSum)
        }
        val colSummary = data.map { it.reduce(::nullableSum) }

        return PanelAnnualReport(
            columns.map { it.format(formatter) },
            rowIndex.toList(),
            data,
            rowSummary,
            calcTrend(rowSummary),
            colSummary,
            colSummary.reduce(::nullableSum) ?: BigDecimal.ZERO
        )
    }

    suspend fun panelInfo(userId: Long, period: YearMonth): PanelInfo {
        val periodSummary = itemRepository.periodSummary(period, userId)
        val lastPeriodSummary = itemRepository.periodSummary(period.minusMonths(1), userId)
        val diffSummary = if (periodSummary != null && lastPeriodSummary != null)
            ((periodSummary.divide(lastPeriodSummary, MathContext.DECIMAL32)) - BigDecimal.ONE)
        else BigDecimal.ZERO

        return PanelInfo(
            itemRepository.listByPeriod(period, userId).toList(),
            itemRepository.monthSummary(period, userId).toList(),
            (periodSummary ?: BigDecimal.ZERO),
            diffSummary
        )
    }

    fun nullableSum(a: BigDecimal?, b: BigDecimal?) = if (a == null) b else if (b == null) a else a + b

    fun calcTrend(values: List<BigDecimal?>) = if (values.count { it != null } > 2)
        simpleRegression(values) else mean(values)

    fun mean(values: List<BigDecimal?>) = DescriptiveStatistics().let { stats ->
        values.forEach { if (it != null) stats.addValue(it.toDouble()) }
        values.indices.map { stats.mean.toBigDecimal().setScale(2, RoundingMode.HALF_DOWN) }
    }

    fun simpleRegression(values: List<BigDecimal?>) = SimpleRegression().let { reg ->
        values.forEachIndexed { idx, it -> if (it != null) reg.addData(idx.toDouble(), it.toDouble()) }
        values.indices.map { reg.predict(it.toDouble()).toBigDecimal().setScale(2, RoundingMode.HALF_DOWN) }
    }
}