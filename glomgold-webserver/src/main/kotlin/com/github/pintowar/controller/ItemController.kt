package com.github.pintowar.controller

import com.github.pintowar.dto.ItemCommand
import com.github.pintowar.dto.toCommand
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import io.micronaut.http.annotation.Controller

@Controller("/api/items")
class ItemController(itemRepository: ItemRepository) : CrudRestController<Item, ItemCommand, Long>(itemRepository) {

    override fun dtoToEntity(dto: ItemCommand): Item = dto.toItem()

    override fun entityToDto(entity: Item): ItemCommand = entity.toCommand()
}