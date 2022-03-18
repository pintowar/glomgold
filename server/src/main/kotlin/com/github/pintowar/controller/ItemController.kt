package com.github.pintowar.controller

import com.github.pintowar.dto.ItemCommand
import com.github.pintowar.dto.RefinePaginateQuery
import com.github.pintowar.dto.toCommand
import com.github.pintowar.repo.ItemRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList

@Controller("/api/items")
class ItemController(private val itemRepository: ItemRepository) {

    @Get("/{?_start,_end,_sort,_order}")
    suspend fun index(@RequestBean bean: RefinePaginateQuery): HttpResponse<List<ItemCommand>> = HttpResponse
        .ok(itemRepository.findAll(bean.paginate()).map { it.toCommand() }.toList())
        .header("X-Total-Count", "${itemRepository.count()}")

    @Post("/")
    suspend fun create(@Body cmd: ItemCommand): HttpResponse<ItemCommand> =
        HttpResponse.ok(itemRepository.save(cmd.toItem()).toCommand())

    @Get("/{id}")
    suspend fun read(@PathVariable id: Long): HttpResponse<ItemCommand> =
        HttpResponse.ok(itemRepository.findById(id)?.toCommand()) ?: HttpResponse.notFound()

    @Patch("/{id}")
    suspend fun update(@PathVariable id: Long, @Body item: ItemCommand): HttpResponse<ItemCommand> =
        itemRepository.findById(id)?.let { _ ->
            HttpResponse.ok(itemRepository.update(item.toItem()).toCommand())
        } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(@PathVariable id: Long): Int = itemRepository.deleteById(id)
}
