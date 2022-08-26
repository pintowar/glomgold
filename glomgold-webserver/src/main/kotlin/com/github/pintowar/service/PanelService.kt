package com.github.pintowar.service

import com.github.pintowar.dto.PanelAnnualReport
import com.github.pintowar.dto.PanelInfo
import com.github.pintowar.repo.ItemRepository
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.toList
import org.nield.kotlinstatistics.average
import org.nield.kotlinstatistics.simpleRegression
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
            rowIndex.indices.map { row -> data[row][col] }.fold(null, ::nullableSum)
        }
        val colSummary = data.map { it.fold(null, ::nullableSum) }
        val colAverage = colSummary.zip(data.map { row -> row.count { it != null } })
            .map { (sum, count) -> sum?.divide(BigDecimal(count), RoundingMode.HALF_UP) }

        return PanelAnnualReport(
            columns.map { it.format(formatter) },
            rowIndex.toList(),
            data,
            rowSummary,
            calcTrend(rowSummary),
            colSummary,
            colAverage,
            colSummary.fold(null, ::nullableSum) ?: BigDecimal.ZERO
        )
    }

    suspend fun panelInfo(userId: Long, period: YearMonth): PanelInfo {
        val periodSummary = itemRepository.periodSummary(period, userId)
        val lastPeriodSummary = itemRepository.periodSummary(period.minusMonths(1), userId)
        val diffSummary = if (periodSummary != null && lastPeriodSummary != null)
            ((periodSummary.divide(lastPeriodSummary, MathContext(4, RoundingMode.HALF_UP))) - BigDecimal.ONE)
        else BigDecimal.ZERO

        return PanelInfo(
            period,
            itemRepository.listByPeriodAndUserIdOrderByCreatedAtAndDescription(period, userId).toList(),
            itemRepository.monthSummary(period, userId).toList(),
            (periodSummary ?: BigDecimal.ZERO),
            diffSummary
        )
    }

    fun nullableSum(a: BigDecimal?, b: BigDecimal?) = if (a == null) b else if (b == null) a else a + b

    fun calcTrend(values: List<BigDecimal?>) = if (values.count { it != null } > 2)
        simpleRegression(values) else mean(values)

    fun mean(values: List<BigDecimal?>) = values.filterNotNull()
        .let { valid ->
            if (valid.isEmpty()) values.indices.map { BigDecimal.ZERO }
            else valid.average().setScale(2, RoundingMode.HALF_DOWN)
                .let { avg -> values.indices.map { avg } }
        }

    fun simpleRegression(values: List<BigDecimal?>) = values.withIndex()
        .filter { (_, it) -> it != null }
        .simpleRegression(xSelector = { it.index }, ySelector = { it.value!! })
        .let { reg ->
            values.indices.map { reg.predict(it.toDouble()).toBigDecimal().setScale(2, RoundingMode.HALF_DOWN) }
        }
}