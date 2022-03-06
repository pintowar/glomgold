package com.github.pintowar.controller

import com.github.pintowar.dto.ItemBody
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.security.authentication.Authentication
import kotlinx.coroutines.flow.toList
import java.math.BigDecimal
import java.math.MathContext
import java.time.LocalDate
import java.time.YearMonth
import java.util.*

@Controller("/api/panel")
class PanelController(
    private val itemRepository: ItemRepository, private val userRepository: UserRepository
) {

    @Get("/")
    suspend fun panel(auth: Authentication, @QueryValue("year") year: Int?, @QueryValue("month") month: Int?) =
        LocalDate.now().let { now ->
            panelInfo(auth.name, YearMonth.of(year ?: now.year, month ?: now.monthValue))
        }

    @Post("/add-item")
    suspend fun addItem(auth: Authentication, @Body item: ItemBody): Map<String, Any> {
        itemRepository.save(
            Item(
                item.description,
                item.value,
                Currency.getInstance("BRL"),
                YearMonth.of(item.year, item.month),
                userRepository.findByUsername(auth.name)?.id!!
            )
        )
        return panelInfo(auth.name, YearMonth.of(item.year, item.month))
    }

    @Patch("/edit-item/{id}")
    suspend fun editItem(
        auth: Authentication, @PathVariable id: Long, @Body item: ItemBody
    ): HttpResponse<Map<String, Any>> {
        val userId = userRepository.findByUsername(auth.name)?.id!!
        return itemRepository.findById(id)?.let { foundItem ->
            if (userId == foundItem.userId) {
                val newItem = foundItem.copy(
                    description = item.description,
                    value = item.value,
                    period = YearMonth.of(item.year, item.month)
                )
                newItem.id = foundItem.id
                newItem.version = foundItem.version
                itemRepository.update(newItem)
                HttpResponse.ok(panelInfo(auth.name, newItem.period))
            } else HttpResponse.notFound()
        } ?: HttpResponse.notFound()
    }

    @Delete("/remove-item/{id}")
    suspend fun removeItem(auth: Authentication, @PathVariable id: Long): HttpResponse<Map<String, Any>> {
        val userId = userRepository.findByUsername(auth.name)?.id!!
        return itemRepository.findById(id)?.let { item ->
            if (userId == item.userId) {
                itemRepository.delete(item)
                HttpResponse.ok(panelInfo(auth.name, item.period))
            } else HttpResponse.notFound()
        } ?: HttpResponse.notFound()
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
            "stats" to itemRepository.monthSummary(period, username).toList(),
            "total" to (periodSummary ?: BigDecimal.ZERO),
            "diff" to diffSummary
        )
    }
}