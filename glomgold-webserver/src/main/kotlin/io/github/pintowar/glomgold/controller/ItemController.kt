package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.ItemCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post

@Controller("/api/items")
class ItemController(
    itemRepository: ItemRepository,
    private val accountRepository: AccountRepository,
    private val categoryRepository: CategoryRepository
) : CrudRestController<Item, ItemCommand, Long>(itemRepository) {
    override fun dtoToEntity(dto: ItemCommand): Item = dto.toItem()

    override fun entityToDto(entity: Item): ItemCommand = entity.toCommand()

    @Post("/")
    override suspend fun create(
        @Body dto: ItemCommand
    ): HttpResponse<ItemCommand> = if (owned(dto)) super.create(dto) else HttpResponse.badRequest()

    @Patch("/{id}")
    override suspend fun update(
        @PathVariable id: Long,
        @Body dto: ItemCommand
    ): HttpResponse<ItemCommand> = if (owned(dto)) super.update(id, dto) else HttpResponse.badRequest()

    private suspend fun owned(dto: ItemCommand): Boolean =
        accountRepository.findByIdAndUserId(dto.accountId, dto.userId) != null &&
            (dto.categoryId == null || categoryRepository.findByIdAndUserId(dto.categoryId, dto.userId) != null)
}