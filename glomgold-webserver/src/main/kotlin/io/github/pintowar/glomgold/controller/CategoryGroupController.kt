package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.CategoryGroupCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.CategoryGroup
import io.github.pintowar.glomgold.repo.CategoryGroupRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.PathVariable
import io.micronaut.security.utils.SecurityService
import io.micronaut.transaction.annotation.Transactional

@Controller("/api/category-groups")
open class CategoryGroupController(
    repository: CategoryGroupRepository,
    private val categoryRepository: CategoryRepository,
    private val securityService: SecurityService
) : CrudRestController<CategoryGroup, CategoryGroupCommand, Long>(repository) {
    override fun entityToDto(entity: CategoryGroup): CategoryGroupCommand = entity.toCommand()

    // Admin forms may leave userId blank: the group then belongs to the caller.
    override fun dtoToEntity(dto: CategoryGroupCommand): CategoryGroup =
        dto.toCategoryGroup(dto.userId ?: securityService.currentUserId())

    // Preserve owner and isSystem, which the edit form does not submit.
    override fun updateEntityFromDto(
        entity: CategoryGroup,
        dto: CategoryGroupCommand
    ): CategoryGroup =
        entity.apply {
            name = dto.name.trim()
            color = dto.color
            position = dto.position
        }

    // Explicit unlink keeps the behaviour correct where the FK is not applied (schema-generate).
    @Delete("/{id}")
    @Transactional
    override suspend fun delete(
        @PathVariable id: Long
    ): Int {
        categoryRepository.clearGroup(id)
        return super.delete(id)
    }
}