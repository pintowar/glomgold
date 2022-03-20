package com.github.pintowar.controller

import com.github.pintowar.dto.ItemCommand
import com.github.pintowar.dto.RefinePaginateQuery
import com.github.pintowar.dto.toCommand
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import io.micronaut.http.annotation.*

@Controller("/api/items")
class ItemController(private val itemRepository: ItemRepository) : CrudRestController<Item, ItemCommand, Long> {

    @Get("/{?_start,_end,_sort,_order}")
    override suspend fun index(@RequestBean page: RefinePaginateQuery) = super.index(page)

    @Post("/")
    override suspend fun create(@Body cmd: ItemCommand) = super.create(cmd)

    @Get("/{id}")
    override suspend fun read(@PathVariable id: Long) = super.read(id)

    @Patch("/{id}")
    override suspend fun update(@PathVariable id: Long, @Body cmd: ItemCommand) = super.update(id, cmd)

    @Delete("/{id}")
    override suspend fun delete(@PathVariable id: Long): Int = super.delete(id)

    override fun repo(): ItemRepository = itemRepository

    override fun cmdToEntity(command: ItemCommand): Item = command.toItem()

    override fun entityToCmd(entity: Item): ItemCommand = entity.toCommand()
}