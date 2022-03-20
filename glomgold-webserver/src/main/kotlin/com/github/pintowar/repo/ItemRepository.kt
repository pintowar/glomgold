package com.github.pintowar.repo

import com.github.pintowar.dto.ItemSummary
import com.github.pintowar.model.Item
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.Join
import io.micronaut.data.annotation.Query
import io.micronaut.data.annotation.Version
import io.micronaut.data.model.Pageable
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal
import java.time.YearMonth

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface ItemRepository : EntityRepository<Item, Long> {

    @Join("user", type = Join.Type.FETCH)
    override fun findAll(): Flow<Item>

    @Join("user", type = Join.Type.FETCH)
    override fun findAll(pageable: Pageable): Flow<Item>

    @Join("user", type = Join.Type.FETCH)
    override suspend fun findById(id: Long): Item?

    @Join("user", type = Join.Type.FETCH)
    fun findByUserIdAndPeriod(userId: Long, period: YearMonth): Flow<Item>

    @Join("user", type = Join.Type.FETCH)
    suspend fun findByIdAndUserId(id: Long, userId: Long): Item?

    @Join("user", type = Join.Type.FETCH)
    fun findByPeriodAndUserIdOrderByCreatedAtAndDescription(period: YearMonth, userId: Long): Flow<Item>

    @Query(
        """
        SELECT i.period, i.description, sum(i.value) as value
        FROM items i
        WHERE i.period = :period AND i.user_id = :userId
        GROUP BY i.period, i.description
        ORDER BY i.description
        """
    )
    fun monthSummary(period: YearMonth, userId: Long): Flow<ItemSummary>

    @Query(
        """
        SELECT i.period, i.description, sum(i.value) as value
        FROM items i
        WHERE extract(year from i.period) = :year AND i.user_id = :userId
        GROUP BY i.period, i.description
        ORDER BY i.period, i.description
        """
    )
    fun yearSummary(year: Int, userId: Long): Flow<ItemSummary>

    @Query(
        """
        SELECT sum(i.value) as value
        FROM items i
        WHERE i.period = :period AND i.user_id = :userId
        """
    )
    suspend fun periodSummary(period: YearMonth, userId: Long): BigDecimal?

    suspend fun update(@Id id: Long, @Version version: Int, description: String, value: BigDecimal): Long
}