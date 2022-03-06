package com.github.pintowar.dto

import com.github.pintowar.model.Item
import io.micronaut.core.annotation.Introspected
import java.math.BigDecimal

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
)

@Introspected
data class PanelInfo(
    val items: List<Item>,
    val stats: List<ItemSummary>,
    val total: BigDecimal,
    val diff: BigDecimal,
)