package com.github.pintowar.controller

import com.github.pintowar.dto.ItemCommand
import com.github.pintowar.dto.toCommand
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import io.micronaut.http.annotation.*

@Controller("/api/items")
class ItemController(itemRepository: ItemRepository) : CrudRestController<Item, ItemCommand, Long>(itemRepository) {

    override fun cmdToEntity(command: ItemCommand): Item = command.toItem()

    override fun entityToCmd(entity: Item): ItemCommand = entity.toCommand()
}