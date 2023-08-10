package io.github.pintowar.glomgold.repo

import io.github.pintowar.glomgold.dto.BalanceSummary
import io.github.pintowar.glomgold.dto.ItemSummary
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.ItemType
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.Query
import io.micronaut.data.annotation.Version
import io.micronaut.data.model.query.builder.sql.Dialect
import io.micronaut.data.r2dbc.annotation.R2dbcRepository
import kotlinx.coroutines.flow.Flow
import java.math.BigDecimal
import java.time.YearMonth

@R2dbcRepository(dialect = Dialect.POSTGRES)
interface ItemRepository : EntityRepository<Item, Long> {

    fun findByUserIdAndPeriod(userId: Long, period: YearMonth): Flow<Item>

    suspend fun findByIdAndUserId(id: Long, userId: Long): Item?

    fun findByIdInAndPeriodAndUserId(id: List<Long>, period: YearMonth, userId: Long): Flow<Item>

    fun listByPeriodAndUserIdOrderByCreatedAtAndDescription(period: YearMonth, userId: Long): Flow<Item>

    @Query(
        """
        SELECT 
            i.period, i.description, i.item_type, 
            sum(case when i.item_type = 'EXPENSE' THEN -i.value ELSE i.value END) as value
        FROM items i
        WHERE i.period = :period AND i.user_id = :userId
        GROUP BY i.period, i.description, i.item_type
        ORDER BY i.item_type, i.description
        """
    )
    fun monthSummary(period: YearMonth, userId: Long): Flow<ItemSummary>

    @Query(
        """
        SELECT 
            i.period, i.description, i.item_type, sum(i.value) as value
        FROM items i
        WHERE extract(year from i.period) = :year AND i.user_id = :userId
        GROUP BY i.period, i.description, i.item_type
        ORDER BY i.period, i.item_type, i.description
        """
    )
    fun yearSummary(year: Int, userId: Long): Flow<ItemSummary>

    @Query(
        """
        SELECT 
            sum(case when i.item_type = 'EXPENSE' THEN i.value ELSE 0 END) as expense,
            sum(case when i.item_type = 'INCOME' THEN i.value ELSE 0 END) as income
        FROM items i
        WHERE i.period = :period AND i.user_id = :userId
        """
    )
    suspend fun periodSummary(period: YearMonth, userId: Long): BalanceSummary

    suspend fun findDistinctDescriptionByUserIdAndDescriptionIlike(userId: Long, description: String): List<String>

    suspend fun update(
        @Id id: Long, @Version version: Int, description: String, value: BigDecimal, itemType: ItemType
    ): Long
}