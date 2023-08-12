package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.ChangePassword
import io.github.pintowar.glomgold.dto.ItemBody
import io.github.pintowar.glomgold.dto.PanelAnnualReport
import io.github.pintowar.glomgold.dto.PanelInfo
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.github.pintowar.glomgold.service.PanelService
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import io.micronaut.security.authentication.Authentication
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.flow.toSet
import java.time.YearMonth

@Controller("/api/panel")
class PanelController(
    private val userRepository: UserRepository,
    private val itemRepository: ItemRepository,
    private val panelService: PanelService
) {

    @Get("/{?period}")
    suspend fun panel(auth: Authentication, @QueryValue period: YearMonth?) =
        panelService.panelInfo(authId(auth), period ?: YearMonth.now())

    @Get("/report{?year,type}")
    suspend fun report(auth: Authentication, @QueryValue year: Int?, @QueryValue type: String?): PanelAnnualReport {
        val currentYear = year ?: YearMonth.now().year
        val currentType = if (type in listOf("EXPENSE", "INCOME")) type else ""
        return panelService.annualReport(authId(auth), currentYear, currentType ?: "")
    }

    @Post("/profile/password")
    suspend fun profilePassword(auth: Authentication, passwords: ChangePassword): HttpResponse<Unit> {
        return userRepository.findById(authId(auth)).let { user ->
            if (user?.checkPassword(passwords.actualPassword) == true) {
                userRepository.update(user.apply { applyPassword(passwords.newPassword) })
                HttpResponse.ok()
            } else {
                HttpResponse.notModified()
            }
        }
    }

    @Get("/item-complete{?description}")
    suspend fun itemComplete(auth: Authentication, @QueryValue description: String?): List<String> {
        val desc = if (description != null) "$description%" else ""
        return if (desc.isNotEmpty()) {
            itemRepository.findDistinctDescriptionByUserIdAndDescriptionIlike(authId(auth), desc)
        } else {
            emptyList()
        }
    }

    @Post("/add-item")
    suspend fun addItem(auth: Authentication, @Body item: ItemBody): HttpResponse<PanelInfo> {
        itemRepository.save(item.toItem(authId(auth)))
        return HttpResponse.ok(panelService.panelInfo(authId(auth), item.period))
    }

    @Patch("/edit-item/{id}")
    suspend fun editItem(auth: Authentication, @PathVariable id: Long, @Body item: ItemBody): HttpResponse<PanelInfo> =
        itemRepository.findByIdAndUserId(id, authId(auth))?.let { foundItem ->
            itemRepository.update(id, foundItem.version!!, item.description, item.value, item.itemType)
            HttpResponse.ok(panelService.panelInfo(authId(auth), foundItem.period))
        } ?: HttpResponse.notFound()

    @Delete("/remove-item/{id}")
    suspend fun removeItem(auth: Authentication, @PathVariable id: Long): HttpResponse<PanelInfo> =
        itemRepository.findByIdAndUserId(id, authId(auth))?.let { item ->
            itemRepository.delete(item)
            HttpResponse.ok(panelService.panelInfo(authId(auth), item.period))
        } ?: HttpResponse.notFound()

    @Delete("/remove-items/{period}{?ids}")
    suspend fun removeItems(auth: Authentication, @PathVariable period: YearMonth, @QueryValue ids: List<Long>?) =
        itemRepository.findByIdInAndPeriodAndUserId(ids ?: emptyList(), period, authId(auth)).toList().let { items ->
            if (items.isEmpty()) {
                HttpResponse.notFound()
            } else {
                itemRepository.deleteAll(items)
                HttpResponse.ok(panelService.panelInfo(authId(auth), period))
            }
        }

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
}