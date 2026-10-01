package io.github.pintowar.glomgold.dto

import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.model.ItemType
import io.micronaut.core.annotation.Introspected
import io.micronaut.core.annotation.ReflectiveAccess
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth

@ReflectiveAccess
@Introspected
data class CsvColumnMapping(
    val description: String? = null,
    val value: String? = null,
    val itemType: String? = null,
    val date: String? = null
)

@ReflectiveAccess
@Introspected
data class ImportPreviewRow(
    val raw: Map<String, String> = emptyMap(),
    val description: String? = null,
    val value: BigDecimal? = null,
    val itemType: ItemType? = null,
    val date: LocalDate? = null,
    val period: YearMonth? = null,
    val valid: Boolean = false,
    val error: String? = null
)

@ReflectiveAccess
@Introspected
data class ImportPreviewResponse(
    val headers: List<String> = emptyList(),
    val hasHeader: Boolean = true,
    val rows: List<ImportPreviewRow> = emptyList(),
    val periodGroups: Map<String, Int> = emptyMap(),
    val origin: ItemOrigin = ItemOrigin.CSV
)

@ReflectiveAccess
@Introspected
data class ImportResult(
    val imported: Int = 0,
    val skipped: Int = 0,
    val errors: List<String> = emptyList(),
    val periods: List<YearMonth> = emptyList()
)