package io.github.pintowar.glomgold.service.parser

import io.github.pintowar.glomgold.dto.ImportPreviewRow
import java.math.BigDecimal
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

internal fun parseAmount(raw: String): BigDecimal? {
    val s = raw.trim().replace(Regex("[^0-9.,\\-]"), "")
    if (s.isBlank()) return null
    val normalized =
        when {
            s.contains(".") && s.contains(",") -> s.replace(".", "").replace(",", ".")
            s.contains(",") -> s.replace(",", ".")
            else -> s
        }
    return try {
        BigDecimal(normalized)
    } catch (e: NumberFormatException) {
        null
    }
}

internal fun parseDate(
    raw: String,
    pattern: String
): LocalDate? {
    val s = raw.trim()
    if (s.isEmpty()) return null
    val candidates =
        listOfNotNull(
            runCatching { DateTimeFormatter.ofPattern(pattern) }.getOrNull(),
            DateTimeFormatter.ISO_LOCAL_DATE,
            runCatching { DateTimeFormatter.ofPattern("dd/MM/yyyy") }.getOrNull(),
            runCatching { DateTimeFormatter.ofPattern("yyyyMMdd") }.getOrNull(),
            runCatching { DateTimeFormatter.ofPattern("MM/dd/yyyy") }.getOrNull()
        )
    for (fmt in candidates) {
        try {
            return LocalDate.parse(s, fmt)
        } catch (e: DateTimeParseException) {
            continue
        }
    }
    // OFX DTPOSTED may include time: 20260930HHMMSS
    if (s.length >= 8 && s.take(8).all { it.isDigit() }) {
        try {
            return LocalDate.parse(s.take(8), DateTimeFormatter.ofPattern("yyyyMMdd"))
        } catch (e: DateTimeParseException) {
            return null
        }
    }
    return null
}

internal fun groupPeriods(rows: List<ImportPreviewRow>): Map<String, Int> =
    rows
        .filter { it.valid && it.period != null }
        .groupingBy { it.period.toString() }
        .eachCount()