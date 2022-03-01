package com.github.pintowar.controller

import com.github.pintowar.ext.between
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import io.micronaut.core.annotation.Introspected
import io.micronaut.data.annotation.TypeDef
import io.micronaut.data.model.DataType
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth
import java.util.*
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull

@Controller("api/items")
class ItemController(private val itemRepository: ItemRepository) {

    @Get("/")
    suspend fun index(
        @QueryValue("_start", defaultValue = "0") start: Int,
        @QueryValue("_end", defaultValue = "25") end: Int,
        @QueryValue("_sort", defaultValue = "id") sort: String,
        @QueryValue("_order", defaultValue = "ASC") order: String
    ): HttpResponse<Flow<ItemCommand>> = HttpResponse
        .ok(itemRepository.findAll(between(start, end, sort, order)).map { ItemCommand.toCommand(it) })
        .header("X-Total-Count", "${itemRepository.count()}")

    @Post("/")
    suspend fun create(@Body cmd: ItemCommand): HttpResponse<ItemCommand> =
        HttpResponse.ok(ItemCommand.toCommand(itemRepository.save(cmd.toItem())))

    @Get("/{id}")
    suspend fun read(@PathVariable id: Long): HttpResponse<ItemCommand> =
        HttpResponse.ok(itemRepository.findById(id)?.let { ItemCommand.toCommand(it) }) ?: HttpResponse.notFound()

    @Put("/{id}")
    suspend fun update(@PathVariable id: Long, @Body item: ItemCommand): HttpResponse<ItemCommand> =
        itemRepository.findById(id)?.let { _ ->
            HttpResponse.ok(itemRepository.update(item.toItem()).let { ItemCommand.toCommand(it) })
        } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(@PathVariable id: Long): Int = itemRepository.deleteById(id)
}

@Introspected
data class ItemCommand(
    val id: Long? = null,
    val version: Int? = null,
    @field:NotBlank val description: String,
    @field:NotBlank val value: BigDecimal,
    @field:TypeDef(type = DataType.STRING) val currency: Currency,
    @field:NotBlank val year: Int,
    @field:NotBlank val month: Int,
    @field:NotNull val userId: Long
) {

    companion object {
        fun toCommand(item: Item) = ItemCommand(
            item.id, item.version, item.description, item.value, item.currency, item.period.year, item.period.monthValue, item.userId
        )
    }

    fun toItem() = Item(description, value, currency, YearMonth.of(year, month), userId)
        .apply {
            id = this@ItemCommand.id
            version = this@ItemCommand.version
        }
}
