package io.github.pintowar.glomgold.repo

import io.github.pintowar.glomgold.model.Category
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import kotlinx.coroutines.flow.Flow

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface CategoryRepository : EntityRepository<Category, Long> {
    @Query(
        """
        SELECT * FROM categories
        WHERE user_id = :userId
        ORDER BY is_system DESC, name
        """
    )
    fun listScoped(userId: Long): Flow<Category>

    suspend fun findByIdAndUserId(
        id: Long,
        userId: Long
    ): Category?

    @Query("SELECT count(*) FROM items WHERE category_id = :categoryId")
    suspend fun countItems(categoryId: Long): Long

    @Query("UPDATE items SET category_id = :targetId WHERE category_id = :sourceId")
    suspend fun transferItems(
        sourceId: Long,
        targetId: Long
    ): Long

    @Query("UPDATE categories SET group_id = NULL WHERE group_id = :groupId")
    suspend fun clearGroup(groupId: Long): Long
}