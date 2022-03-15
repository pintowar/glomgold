package com.github.pintowar.dto

import com.github.pintowar.model.Item
import io.micronaut.core.annotation.Introspected
import io.micronaut.data.annotation.TypeDef
import io.micronaut.data.model.DataType
import java.math.BigDecimal
import java.time.YearMonth

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

@Introspected
data class PanelAnnualReport(
    val columns: List<String>,
    val rowIndex: List<String>,
    val data: List<List<BigDecimal?>>,
    val rowSummary: List<BigDecimal?>,
    val rowTrend: List<BigDecimal>,
    val colSummary: List<BigDecimal?>,
    val colAverage: List<BigDecimal?>,
    val total: BigDecimal,
)