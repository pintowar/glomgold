package com.github.pintowar.controller

import com.github.pintowar.dto.AnnualReport
import com.github.pintowar.dto.ItemBody
import com.github.pintowar.dto.PanelInfo
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.security.authentication.Authentication
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.flow.toSet
import java.math.BigDecimal
import java.math.MathContext
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter

@Controller("/api/panel")
class PanelController(private val itemRepository: ItemRepository) {

    @Get("/")
    suspend fun panel(auth: Authentication, @QueryValue("year") year: Int?, @QueryValue("month") month: Int?) =
        LocalDate.now().let { now ->
            panelInfo(auth, YearMonth.of(year ?: now.year, month ?: now.monthValue))
        }

    @Get("/report")
    suspend fun report(auth: Authentication, @QueryValue("year") year: Int?): Map<String, Any> {
        val currentYear = year ?: LocalDate.now().year
        val formatter = DateTimeFormatter.ofPattern("MMM")
        val summary = itemRepository.yearSummary(currentYear, authId(auth)).toList()
        return AnnualReport(currentYear, summary).formatTable(formatter)
    }

    @Post("/add-item")
    suspend fun addItem(auth: Authentication, @Body item: ItemBody): HttpResponse<PanelInfo> {
        itemRepository.save(item.toItem(authId(auth)))
        return HttpResponse.ok(panelInfo(auth, YearMonth.of(item.year, item.month)))
    }

    @Patch("/edit-item/{id}")
    suspend fun editItem(auth: Authentication, @PathVariable id: Long, @Body item: ItemBody): HttpResponse<PanelInfo> =
        itemRepository.findByIdAndUserId(id, authId(auth))?.let { foundItem ->
            itemRepository.update(id, foundItem.version!!, item.description, item.value)
            HttpResponse.ok(panelInfo(auth, foundItem.period))
        } ?: HttpResponse.notFound()

    @Delete("/remove-item/{id}")
    suspend fun removeItem(auth: Authentication, @PathVariable id: Long): HttpResponse<PanelInfo> =
        itemRepository.findByIdAndUserId(id, authId(auth))?.let { item ->
            itemRepository.delete(item)
            HttpResponse.ok(panelInfo(auth, item.period))
        } ?: HttpResponse.notFound()

    @Post("/copy-items")
    suspend fun copyItems(auth: Authentication, @Body items: List<ItemBody>): HttpResponse<List<Item>> {
        val itemsToCopy = items.map { it.toItem(authId(auth)) }.groupBy { it.period }
            .flatMap { (period, periodItems) ->
                val nextPeriod = period.plusMonths(1)
                val nextItemsDesc = itemRepository.findByUserIdAndPeriod(authId(auth), nextPeriod)
                    .map { it.description }.toSet()
                periodItems.filter { it.description !in nextItemsDesc }.map { it.copy(period = nextPeriod) }
            }
        val savedItems = if (itemsToCopy.isNotEmpty()) itemRepository.saveAll(itemsToCopy).toList() else itemsToCopy
        return HttpResponse.ok(savedItems)
    }

    private fun authId(auth: Authentication): Long = auth.attributes["userId"] as Long

    private suspend fun panelInfo(auth: Authentication, period: YearMonth): PanelInfo {
        val userId = authId(auth)
        val periodSummary = itemRepository.periodSummary(period, userId)
        val lastPeriodSummary = itemRepository.periodSummary(period.minusMonths(1), userId)
        val diffSummary = if (periodSummary != null && lastPeriodSummary != null)
            ((periodSummary.divide(lastPeriodSummary, MathContext.DECIMAL32)) - BigDecimal.ONE)
        else BigDecimal.ZERO

        return PanelInfo(
            itemRepository.listByPeriod(period, userId).toList(),
            itemRepository.monthSummary(period, userId).toList(),
            (periodSummary ?: BigDecimal.ZERO),
            diffSummary
        )
    }
}