package io.github.pintowar.glomgold.service

import io.github.pintowar.glomgold.model.Category
import io.github.pintowar.glomgold.model.CategoryGroup
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.CategoryGroupRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import mu.KLogging
import tools.jackson.databind.JsonNode
import tools.jackson.module.kotlin.jacksonObjectMapper

@Singleton
class CategorySeedService(
    private val categoryGroupRepository: CategoryGroupRepository,
    private val categoryRepository: CategoryRepository
) : KLogging() {
    private val mapper = jacksonObjectMapper()

    suspend fun seedDefaults(user: User) {
        val userId = user.id!!
        // Any existing category means this user has already been seeded (or created their own).
        if (categoryRepository.listScoped(userId).firstOrNull() != null) return

        val pt = user.locale.language.equals("pt", ignoreCase = true)
        val groups =
            mapper.readTree(
                javaClass.getResourceAsStream("/app/data/default_categories.json")
                    ?: error("app/data/default_categories.json is missing from the classpath")
            )

        groups.forEach { groupNode ->
            val group =
                categoryGroupRepository.save(
                    CategoryGroup(
                        name = groupNode.localized("name", pt),
                        color = groupNode["color"]?.asString() ?: "#6B7280",
                        position = groupNode["position"]?.asInt() ?: 0,
                        isSystem = true,
                        userId = userId
                    )
                )
            groupNode["categories"].forEach { categoryNode ->
                categoryRepository.save(
                    Category(
                        name = categoryNode.localized("name", pt),
                        color = group.color,
                        isSystem = true,
                        userId = userId,
                        groupId = group.id
                    )
                )
            }
        }
        logger.info { "Seeded ${groups.sumOf { it["categories"].size() }} default categories for user $userId" }
    }

    private fun JsonNode.localized(
        field: String,
        pt: Boolean
    ): String =
        this[field]?.get(if (pt) "pt_BR" else "en")?.asString()
            ?: this[field]?.get("en")?.asString()
            ?: ""
}