package io.github.pintowar.glomgold.service

import io.github.pintowar.glomgold.dto.CsvColumnMapping
import io.github.pintowar.glomgold.dto.ImportPreviewResponse
import io.github.pintowar.glomgold.dto.ImportPreviewRow
import io.github.pintowar.glomgold.dto.ImportResult
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.service.parser.CsvImportParser
import io.github.pintowar.glomgold.service.parser.OfxImportParser
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.toList
import java.time.YearMonth

@Singleton
class ImportService(
    private val itemRepository: ItemRepository,
    private val csvParser: CsvImportParser,
    private val ofxParser: OfxImportParser
) {
    fun detectOrigin(
        filename: String,
        bytes: ByteArray
    ): ItemOrigin {
        val lower = filename.lowercase()
        if (lower.endsWith(".ofx")) return ItemOrigin.OFX
        if (lower.endsWith(".csv")) return ItemOrigin.CSV
        val head =
            bytes
                .take(512)
                .toByteArray()
                .toString(Charsets.UTF_8)
                .uppercase()
        return if (head.contains("<OFX") || head.contains("OFXHEADER")) ItemOrigin.OFX else ItemOrigin.CSV
    }

    fun previewCsv(
        bytes: ByteArray,
        separator: Char = ',',
        dateFormat: String = "yyyy-MM-dd",
        hasHeader: Boolean = true,
        mapping: CsvColumnMapping = CsvColumnMapping()
    ): ImportPreviewResponse = csvParser.preview(bytes, separator, dateFormat, hasHeader, mapping)

    fun previewOfx(bytes: ByteArray): ImportPreviewResponse = ofxParser.preview(bytes)

    fun defaultMapping(headers: List<String>): CsvColumnMapping = csvParser.defaultMapping(headers)

    suspend fun importParsed(
        userId: Long,
        rows: List<ImportPreviewRow>,
        origin: ItemOrigin
    ): ImportResult {
        val valid = rows.filter { it.valid && it.description != null && it.value != null && it.itemType != null }
        if (valid.isEmpty()) return ImportResult(0, rows.size, rows.mapNotNull { it.error }.distinct(), emptyList())

        val items =
            valid.map {
                Item(it.description!!.trim(), it.value!!, it.itemType!!, it.period ?: YearMonth.now(), userId, origin)
            }
        var skipped = rows.size - valid.size
        val toSave = mutableListOf<Item>()
        val errors = mutableListOf<String>()
        for (item in items) {
            val dupe =
                itemRepository.existsByUserIdAndPeriodAndDescriptionAndValueAndItemType(
                    userId,
                    item.period,
                    item.description,
                    item.value,
                    item.itemType
                )
            if (dupe) {
                skipped++
            } else {
                toSave.add(item)
            }
        }
        if (toSave.isNotEmpty()) itemRepository.saveAll(toSave).toList()
        val periods = toSave.map { it.period }.distinct().sorted()
        return ImportResult(toSave.size, skipped, errors, periods)
    }
}