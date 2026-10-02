package io.github.pintowar.glomgold.service.parser

import io.github.pintowar.glomgold.dto.ImportPreviewResponse
import io.github.pintowar.glomgold.dto.ImportPreviewRow
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.model.ItemType
import jakarta.inject.Singleton
import java.math.BigDecimal
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.CodingErrorAction
import java.time.YearMonth

@Singleton
class OfxImportParser {
    fun preview(bytes: ByteArray): ImportPreviewResponse {
        val rows = parseRows(decodeBytes(bytes))
        return ImportPreviewResponse(emptyList(), false, rows, groupPeriods(rows), ItemOrigin.OFX)
    }

    private fun parseRows(text: String): List<ImportPreviewRow> {
        val blocks = Regex("(?is)<STMTTRN>(.*?)</STMTTRN>").findAll(text).map { it.groupValues[1] }.toList()
        if (blocks.isEmpty()) return listOf(ImportPreviewRow(error = "No transactions found in OFX file"))
        return blocks.mapNotNull { block ->
            fun tag(name: String): String =
                Regex("(?is)<$name>([^<\\n\\r]*)")
                    .find(block)
                    ?.groupValues
                    ?.getOrNull(1)
                    ?.trim() ?: ""
            val amountRaw = tag("TRNAMT")
            val dateRaw = tag("DTPOSTED")
            val memo = tag("MEMO")
            val name = tag("NAME")
            val desc = (memo.ifBlank { name }).ifBlank { "Unknown" }
            // Balance-summary rows emitted by some Brazilian banks (e.g. Banco do Brasil)
            // arrive as <STMTTRN> blocks but are not real transactions: drop them silently.
            if (isBalanceSummaryRow(desc)) return@mapNotNull null
            val signed = parseAmount(amountRaw)
            if (signed == null) return@mapNotNull ImportPreviewRow(error = "Invalid amount: $amountRaw")
            val value = signed.abs()
            if (value <= BigDecimal.ZERO) return@mapNotNull ImportPreviewRow(error = "Value must be greater than zero")
            // Transaction type follows the amount sign; TRNTYPE is ignored
            // (banks are inconsistent with it).
            val itemType = if (signed < BigDecimal.ZERO) ItemType.EXPENSE else ItemType.INCOME
            val date = parseDate(dateRaw, "yyyyMMdd")
            if (date == null) return@mapNotNull ImportPreviewRow(error = "Invalid date: $dateRaw")
            ImportPreviewRow(
                raw = mapOf("TRNTYPE" to tag("TRNTYPE"), "DTPOSTED" to dateRaw, "TRNAMT" to amountRaw, "MEMO" to desc),
                description = desc,
                value = value,
                itemType = itemType,
                date = date,
                period = YearMonth.from(date),
                valid = true
            )
        }
    }

    private fun isBalanceSummaryRow(description: String): Boolean {
        val normalized = description.trim().lowercase()
        return OFX_BALANCE_ROW_DESCRIPTIONS.any { normalized.startsWith(it) }
    }

    private fun decodeBytes(bytes: ByteArray): String =
        try {
            Charsets.UTF_8
                .newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes))
                .toString()
        } catch (e: CharacterCodingException) {
            bytes.toString(Charsets.ISO_8859_1)
        }

    companion object {
        // Descriptions used by some Brazilian banks (e.g. Banco do Brasil) for
        // balance-summary rows that arrive as <STMTTRN> blocks but are not real
        // transactions. Matched case-insensitively against MEMO/NAME.
        private val OFX_BALANCE_ROW_DESCRIPTIONS =
            listOf(
                "saldo anterior",
                "saldo do dia",
                "saldo final",
                "s a l d o"
            )
    }
}