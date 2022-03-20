package com.github.pintowar.model

import io.micronaut.data.annotation.*
import io.micronaut.data.model.DataType
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import java.math.BigDecimal
import java.time.Instant
import java.time.YearMonth
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull

@Indexes(
    Index(name = "item_period_user", columns = ["period", "user_id"]),
)
@MappedEntity(value = "items", namingStrategy = UnderScoreSeparatedLowerCase::class)
data class Item(
    @field:NotBlank var description: String,
    @field:NotNull var value: BigDecimal,
    @field:TypeDef(type = DataType.TIMESTAMP) var period: YearMonth,
    @field:Relation(Relation.Kind.MANY_TO_ONE, cascade = [Relation.Cascade.NONE])
    @field:NotNull var user: User,
) : Entity() {

    constructor(
        id: Long?,
        version: Int?,
        description: String,
        value: BigDecimal,
        period: YearMonth,
        user: User,
        createdAt: Instant? = null,
        updatedAt: Instant? = null
    ) : this(description, value, period, user) {
        this.id = id
        this.version = version
        this.createdAt = createdAt
        this.updatedAt = updatedAt
    }
}