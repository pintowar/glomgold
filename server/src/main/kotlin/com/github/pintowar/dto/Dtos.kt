package com.github.pintowar.dto

import io.micronaut.core.annotation.Introspected
import java.math.BigDecimal

@Introspected
data class ItemSummary(
    val description: String,
    val value: BigDecimal
)

@Introspected
data class AddItem(
    val year: Int,
    val month: Int,
    val description: String,
    val value: BigDecimal
)

@Introspected
data class RemoveItem(
    val id: Long,
    val year: Int,
    val month: Int,
)