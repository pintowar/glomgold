package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.CategoryCommand
import io.github.pintowar.glomgold.dto.CategoryGroupCommand
import io.github.pintowar.glomgold.dto.CategoryUsage
import io.github.pintowar.glomgold.dto.toCommand
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
import io.micronaut.http.annotation.QueryValue
import io.micronaut.security.utils.SecurityService
import io.micronaut.transaction.annotation.Transactional
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList

/** Category and group management for the logged-in user only: foreign ids always answer 404. */
@Controller("/api/panel")
open class PanelCategoryController(
    private val categoryRepository: CategoryRepository,
    private val categoryGroupRepository: CategoryGroupRepository,
    private val securityService: SecurityService
) {
    @Get("/categories")
    suspend fun categories(): List<CategoryCommand> =
        categoryRepository.listScoped(securityService.currentUserId()).map { it.toCommand() }.toList()

    @Get("/categories/{id}")
    suspend fun readCategory(
        @PathVariable id: Long
    ): HttpResponse<CategoryCommand> =
        categoryRepository
            .findByIdAndUserId(id, securityService.currentUserId())
            ?.let { HttpResponse.ok(it.toCommand()) }
            ?: HttpResponse.notFound()

    @Post("/categories")
    suspend fun createCategory(
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand> {
        val userId = securityService.currentUserId()
        if (!groupOwned(dto.groupId, userId)) return HttpResponse.badRequest()
        val category = categoryRepository.save(dto.toCategory(userId).apply { isSystem = false })
        return HttpResponse.ok(category.toCommand())
    }

    @Patch("/categories/{id}")
    suspend fun updateCategory(
        @PathVariable id: Long,
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand> {
        val userId = securityService.currentUserId()
        val category = categoryRepository.findByIdAndUserId(id, userId) ?: return HttpResponse.notFound()
        if (!groupOwned(dto.groupId, userId)) return HttpResponse.badRequest()
        category.name = dto.name.trim()
        category.color = dto.color
        category.groupId = dto.groupId
        categoryRepository.update(category)
        return HttpResponse.ok(category.toCommand())
    }

    @Get("/categories/usage/{id}")
    suspend fun categoryUsage(
        @PathVariable id: Long
    ): HttpResponse<CategoryUsage> =
        categoryRepository
            .findByIdAndUserId(id, securityService.currentUserId())
            ?.let { HttpResponse.ok(CategoryUsage(id, categoryRepository.countItems(id))) }
            ?: HttpResponse.notFound()

    // Same contract as the admin delete: items must be transferred to another category owned by the caller.
    @Delete("/categories/{id}")
    @Transactional
    open suspend fun deleteCategory(
        @PathVariable id: Long,
        @QueryValue transferTo: Long?
    ): HttpResponse<Unit> {
        val userId = securityService.currentUserId()
        val category = categoryRepository.findByIdAndUserId(id, userId) ?: return HttpResponse.notFound()
        if (categoryRepository.countItems(id) > 0) {
            val target =
                transferTo
                    ?.takeIf { it != id }
                    ?.let { categoryRepository.findByIdAndUserId(it, userId) }
            if (target == null) {
                return HttpResponse.status(if (transferTo == null) HttpStatus.CONFLICT else HttpStatus.BAD_REQUEST)
            }
            categoryRepository.transferItems(id, target.id!!)
        }
        categoryRepository.delete(category)
        return HttpResponse.ok()
    }

    @Get("/category-groups")
    suspend fun categoryGroups(): List<CategoryGroupCommand> =
        categoryGroupRepository.listScoped(securityService.currentUserId()).map { it.toCommand() }.toList()

    @Get("/category-groups/{id}")
    suspend fun readCategoryGroup(
        @PathVariable id: Long
    ): HttpResponse<CategoryGroupCommand> =
        categoryGroupRepository
            .findByIdAndUserId(id, securityService.currentUserId())
            ?.let { HttpResponse.ok(it.toCommand()) }
            ?: HttpResponse.notFound()

    @Post("/category-groups")
    suspend fun createCategoryGroup(
        @Body dto: CategoryGroupCommand
    ): HttpResponse<CategoryGroupCommand> {
        val userId = securityService.currentUserId()
        val group = categoryGroupRepository.save(dto.toCategoryGroup(userId).apply { isSystem = false })
        return HttpResponse.ok(group.toCommand())
    }

    @Patch("/category-groups/{id}")
    suspend fun updateCategoryGroup(
        @PathVariable id: Long,
        @Body dto: CategoryGroupCommand
    ): HttpResponse<CategoryGroupCommand> =
        categoryGroupRepository.findByIdAndUserId(id, securityService.currentUserId())?.let { group ->
            group.name = dto.name.trim()
            group.color = dto.color
            group.position = dto.position
            categoryGroupRepository.update(group)
            HttpResponse.ok(group.toCommand())
        } ?: HttpResponse.notFound()

    // Explicit unlink keeps the behaviour correct where the FK is not applied (schema-generate).
    @Delete("/category-groups/{id}")
    @Transactional
    open suspend fun deleteCategoryGroup(
        @PathVariable id: Long
    ): HttpResponse<Unit> =
        categoryGroupRepository.findByIdAndUserId(id, securityService.currentUserId())?.let { group ->
            categoryRepository.clearGroup(id)
            categoryGroupRepository.delete(group)
            HttpResponse.ok()
        } ?: HttpResponse.notFound()

    private suspend fun groupOwned(
        groupId: Long?,
        userId: Long
    ): Boolean = groupId == null || categoryGroupRepository.findByIdAndUserId(groupId, userId) != null
}