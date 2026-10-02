package io.github.pintowar.glomgold.service.parser

import io.github.pintowar.glomgold.dto.CsvColumnMapping
import io.github.pintowar.glomgold.dto.ImportPreviewResponse
import io.github.pintowar.glomgold.dto.ImportPreviewRow
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.model.ItemType
import jakarta.inject.Singleton
import java.math.BigDecimal
import java.time.YearMonth

@Singleton
class CsvImportParser {
    fun preview(
        bytes: ByteArray,
        separator: Char = ',',
        dateFormat: String = "yyyy-MM-dd",
        hasHeader: Boolean = true,
        mapping: CsvColumnMapping = CsvColumnMapping()
    ): ImportPreviewResponse {
        val text = bytes.toString(Charsets.UTF_8).replace("\r\n", "\n").replace("\r", "\n")
        val lines = text.split("\n").filter { it.isNotBlank() }
        if (lines.isEmpty()) return ImportPreviewResponse(emptyList(), hasHeader, emptyList(), emptyMap())

        val table = lines.map { splitLine(it, separator) }
        val headers: List<String> =
            if (hasHeader) {
                table.first().mapIndexed { idx, h -> h.ifBlank { "#$idx" } }
            } else {
                table.first().indices.map { "#$it" }
            }
        val dataLines = if (hasHeader) table.drop(1) else table

        val rows =
            dataLines.map { cols ->
                val raw = headers.mapIndexed { idx, h -> h to (cols.getOrNull(idx) ?: "") }.toMap()
                parseRow(raw, headers, mapping, dateFormat)
            }
        return ImportPreviewResponse(headers, hasHeader, rows, groupPeriods(rows), ItemOrigin.CSV)
    }

    fun defaultMapping(headers: List<String>): CsvColumnMapping {
        fun find(vararg names: String): String? =
            headers.firstOrNull { h -> names.any { it.equals(h, ignoreCase = true) } }
        return CsvColumnMapping(
            description = find("description", "descricao", "descrição", "memo", "desc"),
            value = find("value", "valor", "amount", "trnamt", "vlr"),
            itemType = find("type", "tipo", "item_type", "itemtype", "trntype"),
            date = find("date", "data", "dtposted", "posted", "day")
        )
    }

    private fun parseRow(
        raw: Map<String, String>,
        headers: List<String>,
        mapping: CsvColumnMapping,
        dateFormat: String
    ): ImportPreviewRow {
        val desc = resolveColumn(raw, headers, mapping.description) ?: ""
        val valueRaw = resolveColumn(raw, headers, mapping.value) ?: ""
        val typeRaw = resolveColumn(raw, headers, mapping.itemType) ?: ""
        val dateRaw = resolveColumn(raw, headers, mapping.date) ?: ""
        if (desc.isBlank()) return ImportPreviewRow(raw, error = "Missing description")
        val value = parseAmount(valueRaw) ?: return ImportPreviewRow(raw, desc, error = "Invalid value: $valueRaw")
        if (value <= BigDecimal.ZERO) return ImportPreviewRow(raw, desc, error = "Value must be greater than zero")
        val itemType = parseType(typeRaw, valueRaw)
        val date = parseDate(dateRaw, dateFormat)
        if (date == null) return ImportPreviewRow(raw, desc, value, itemType, error = "Invalid date: $dateRaw")
        return ImportPreviewRow(raw, desc, value, itemType, date, YearMonth.from(date), true, null)
    }

    private fun resolveColumn(
        raw: Map<String, String>,
        headers: List<String>,
        ref: String?
    ): String? {
        if (ref.isNullOrBlank()) {
            // auto-detect: first header matching common names, else positional fallback is handled by caller order
            return null
        }
        if (raw.containsKey(ref)) return raw[ref]
        val idx = ref.removePrefix("#").toIntOrNull()
        if (idx != null && idx in headers.indices) return raw[headers[idx]]
        // case-insensitive header match
        val hit = headers.firstOrNull { it.equals(ref, ignoreCase = true) }
        return hit?.let { raw[it] }
    }

    private fun parseType(
        raw: String,
        valueRaw: String
    ): ItemType {
        when (raw.trim().uppercase()) {
            "INCOME", "RECEITA", "RECEITAS", "CREDIT", "CREDITO", "CRÉDITO", "C" -> return ItemType.INCOME
            "EXPENSE", "DESPESA", "DESPESAS", "DEBIT", "DEBITO", "DÉBITO", "D" -> return ItemType.EXPENSE
        }
        // fallback: negative values are expenses
        val amt = parseAmount(valueRaw)
        if (amt != null && amt < BigDecimal.ZERO) return ItemType.EXPENSE
        // OFX-style sign prefix
        if (valueRaw.trim().startsWith("-")) return ItemType.EXPENSE
        return ItemType.EXPENSE
    }

    private fun splitLine(
        line: String,
        separator: Char
    ): List<String> {
        val out = mutableListOf<String>()
        val cur = StringBuilder()
        var inQuotes = false
        var i = 0
        while (i < line.length) {
            val c = line[i]
            when {
                c == '"' -> {
                    if (inQuotes && i + 1 < line.length && line[i + 1] == '"') {
                        cur.append('"')
                        i++
                    } else {
                        inQuotes = !inQuotes
                    }
                }
                c == separator && !inQuotes -> {
                    out.add(cur.toString().trim())
                    cur.clear()
                }
                else -> cur.append(c)
            }
            i++
        }
        out.add(cur.toString().trim())
        return out
    }
}