package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.ItemCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.repo.ItemRepository
import io.micronaut.http.annotation.Controller

@Controller("/api/items")
class ItemController(itemRepository: ItemRepository) : CrudRestController<Item, ItemCommand, Long>(itemRepository) {

    override fun dtoToEntity(dto: ItemCommand): Item = dto.toItem()

    override fun entityToDto(entity: Item): ItemCommand = entity.toCommand()
}