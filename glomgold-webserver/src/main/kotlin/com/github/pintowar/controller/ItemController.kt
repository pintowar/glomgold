package com.github.pintowar.controller

import com.github.pintowar.dto.ItemCommand
import com.github.pintowar.dto.toCommand
import com.github.pintowar.model.Item
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.PathVariable

@Controller("/api/items")
class ItemController(
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository
) : CrudRestController<Item, ItemCommand, Long>(itemRepository) {

    override suspend fun read(id: Long): HttpResponse<ItemCommand> = itemRepository.findById(id)
        .let { if (it != null) HttpResponse.ok(entityToCmd(it)) else HttpResponse.notFound() }

    override suspend fun update(id: Long, cmd: ItemCommand): HttpResponse<ItemCommand> =
        itemRepository.findById(id)?.let { _ ->
            itemRepository.update(cmdToEntity(cmd)).let { HttpResponse.ok(entityToCmd(it)) }
        } ?: HttpResponse.notFound()

    override suspend fun cmdToEntity(command: ItemCommand): Item = command.toItem(userRepository)

    override suspend fun entityToCmd(entity: Item): ItemCommand = entity.toCommand()
}