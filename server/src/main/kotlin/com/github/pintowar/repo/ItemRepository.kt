package com.github.pintowar.repo

import com.github.pintowar.dto.ItemSummary
import com.github.pintowar.model.Item
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.Query
import io.micronaut.data.annotation.Version
import io.micronaut.data.model.Pageable
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import io.micronaut.data.repository.jpa.kotlin.CoroutineJpaSpecificationExecutor
import io.micronaut.data.repository.kotlin.CoroutineCrudRepository
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal
import java.time.YearMonth

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface ItemRepository : CoroutineCrudRepository<Item, Long>, CoroutineJpaSpecificationExecutor<Item> {

    fun findAll(pageable: Pageable): Flow<Item>

    fun findByUserIdAndPeriod(userId: Long, period: YearMonth): Flow<Item>

    suspend fun findByIdAndUserId(id: Long, userId: Long): Item?

    @Query(
        """
        SELECT i.*
        FROM items i
        WHERE i.period = :period AND i.user_id = :userId
        ORDER BY i.created_at, i.description
        """
    )
    fun listByPeriod(period: YearMonth, userId: Long): Flow<Item>

    @Query(
        """
        SELECT i.period, i.description, sum(i.value) value
        FROM items i
        WHERE i.period = :period AND i.user_id = :userId
        GROUP BY i.period, i.description
        ORDER BY i.description
        """
    )
    fun monthSummary(period: YearMonth, userId: Long): Flow<ItemSummary>

    @Query(
        """
        SELECT i.period, i.description, sum(i.value) value
        FROM items i
        WHERE extract(year from i.period) = :year AND i.user_id = :userId
        GROUP BY i.period, i.description
        ORDER BY i.period, i.description
        """
    )
    fun yearSummary(year: Int, userId: Long): Flow<ItemSummary>

    @Query(
        """
        SELECT sum(i.value)
        FROM items i
        WHERE i.period = :period AND i.user_id = :userId
        """
    )
    suspend fun periodSummary(period: YearMonth, userId: Long): BigDecimal?

    suspend fun update(@Id id: Long, @Version version: Int, description: String, value: BigDecimal): Long
}