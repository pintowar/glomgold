package io.github.pintowar.glomgold.repo

import io.github.pintowar.glomgold.model.CategoryGroup
import io.micronaut.data.annotation.Query
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import kotlinx.coroutines.flow.Flow

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface CategoryGroupRepository : EntityRepository<CategoryGroup, Long> {
    @Query(
        """
        SELECT * FROM category_groups
        WHERE user_id = :userId
        ORDER BY position, name
        """
    )
    fun listScoped(userId: Long): Flow<CategoryGroup>

    suspend fun findByIdAndUserId(
        id: Long,
        userId: Long
    ): CategoryGroup?
}