package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.CategoryCommand
import io.github.pintowar.glomgold.dto.CategoryUsage
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.Category
import io.github.pintowar.glomgold.repo.CategoryGroupRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.http.context.ServerRequestContext
import io.micronaut.http.exceptions.HttpStatusException
import io.micronaut.security.utils.SecurityService
import io.micronaut.transaction.annotation.Transactional

@Controller("/api/categories")
open class CategoryController(
    private val repository: CategoryRepository,
    private val groupRepository: CategoryGroupRepository,
    private val securityService: SecurityService
) : CrudRestController<Category, CategoryCommand, Long>(repository) {
    override fun entityToDto(entity: Category): CategoryCommand = entity.toCommand()

    // Admin forms may leave userId blank: the category then belongs to the caller.
    override fun dtoToEntity(dto: CategoryCommand): Category =
        dto.toCategory(dto.userId ?: securityService.currentUserId())

    // Preserve owner and isSystem, which the edit form does not submit.
    override fun updateEntityFromDto(
        entity: Category,
        dto: CategoryCommand
    ): Category =
        entity.apply {
            name = dto.name.trim()
            color = dto.color
            groupId = dto.groupId
        }

    @Post("/")
    override suspend fun create(
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand> =
        if (groupOwned(dto.groupId, dto.userId ?: securityService.currentUserId())) {
            super.create(dto)
        } else {
            HttpResponse.badRequest()
        }

    @Patch("/{id}")
    override suspend fun update(
        @PathVariable id: Long,
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand> {
        val owner = repository.findById(id)?.userId ?: return HttpResponse.notFound()
        return if (groupOwned(dto.groupId, owner)) super.update(id, dto) else HttpResponse.badRequest()
    }

    @Get("/usage/{id}")
    suspend fun usage(
        @PathVariable id: Long
    ): HttpResponse<CategoryUsage> =
        repository
            .findById(id)
            ?.let { HttpResponse.ok(CategoryUsage(id, repository.countItems(id))) }
            ?: HttpResponse.notFound()

    // CrudRestController fixes the delete signature, so the transferTo query param is read from the request.
    @Delete("/{id}")
    @Transactional
    override suspend fun delete(
        @PathVariable id: Long
    ): Int {
        val category =
            repository.findById(id)
                ?: throw HttpStatusException(HttpStatus.NOT_FOUND, "Category $id not found")
        if (repository.countItems(id) > 0) {
            val request = ServerRequestContext.currentRequest<Any>()
            val transferTo = request.map { it.parameters.get("transferTo")?.toLongOrNull() }.orElse(null)
            val target = transferTo?.let { repository.findById(it) }
            if (target == null || target.userId != category.userId) {
                val status = if (transferTo == null) HttpStatus.CONFLICT else HttpStatus.BAD_REQUEST
                throw HttpStatusException(status, "Invalid transfer destination for category $id")
            }
            repository.transferItems(id, target.id!!)
        }
        repository.delete(category)
        return 1
    }

    private suspend fun groupOwned(
        groupId: Long?,
        userId: Long
    ): Boolean = groupId == null || groupRepository.findByIdAndUserId(groupId, userId) != null
}