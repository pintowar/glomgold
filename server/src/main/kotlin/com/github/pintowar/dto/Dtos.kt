package com.github.pintowar.dto

import com.github.pintowar.model.Item
import io.micronaut.core.annotation.Introspected
import java.math.BigDecimal
import java.time.YearMonth
import java.util.*

@Introspected
data class ItemSummary(
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