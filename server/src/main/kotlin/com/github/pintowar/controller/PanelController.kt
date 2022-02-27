package com.github.pintowar.controller

import com.github.pintowar.dto.AddItem
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.MediaType
import io.micronaut.http.annotation.*
import io.micronaut.security.authentication.Authentication
import io.micronaut.views.View
import kotlinx.coroutines.flow.toList
import java.math.BigDecimal
import java.math.MathContext
import java.time.LocalDate
import java.time.YearMonth
import java.util.*

@Controller
class PanelController(
    private val itemRepository: ItemRepository, private val userRepository: UserRepository
) {

    @View("panel")
    @Get("/panel")
    suspend fun panel(auth: Authentication, @QueryValue("year") year: Int?, @QueryValue("month") month: Int?) =
        LocalDate.now().let { now ->
            panelInfo(auth.name, YearMonth.of(year ?: now.year, month ?: now.monthValue))
        }

    @View("panel")
    @Post("/panel/remove-item/{id}")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    suspend fun removeItem(auth: Authentication, @PathVariable id: Long): HttpResponse<Map<String, Any>> {
        return itemRepository.findById(id)?.let { item ->
            itemRepository.delete(item)
            HttpResponse.ok(panelInfo(auth.name, item.period))
        } ?: HttpResponse.notFound()
    }


    @View("panel")
    @Post("/panel/add-item")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    suspend fun addItem(auth: Authentication, @Body item: AddItem): Map<String, Any> {
        itemRepository.save(
            Item(
                item.description,
                item.value,
                Currency.getInstance("BRL"),
                YearMonth.of(item.year, item.month),
                userRepository.findByUsername(auth.name)
            )
        )
        return panelInfo(auth.name, YearMonth.of(item.year, item.month))
    }

    private suspend fun panelInfo(username: String, period: YearMonth): Map<String, Any> {
        val periodSummary = itemRepository.periodSummary(period, username)
        val lastPeriodSummary = itemRepository.periodSummary(period.minusMonths(1), username)
        val diffSummary = if (periodSummary != null && lastPeriodSummary != null) ((periodSummary.divide(
            lastPeriodSummary,
            MathContext.DECIMAL32
        )) - BigDecimal.ONE) else BigDecimal.ZERO
        return mapOf(
            "items" to itemRepository.listByPeriod(period, username).toList(),
            "monthSummary" to itemRepository.monthSummary(period, username).toList(),
            "periodSummary" to (periodSummary ?: BigDecimal.ZERO),
            "diffSummary" to diffSummary,
            "period" to period
        )
    }
}