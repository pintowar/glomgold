package com.github.pintowar.model

import io.micronaut.data.annotation.*
import io.micronaut.data.model.DataType
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import java.math.BigDecimal
import java.time.Instant
import java.time.YearMonth
import java.util.Currency
import javax.validation.constraints.NotBlank

@Indexes(
    Index(name = "period_user", columns = ["period", "user"]),
)
@MappedEntity(value = "items", namingStrategy = UnderScoreSeparatedLowerCase::class)
data class Item(
    @field:NotBlank var description: String,
    var value: BigDecimal,
    @field:TypeDef(type = DataType.STRING) var currency: Currency,
    @field:TypeDef(type = DataType.TIMESTAMP) var period: YearMonth,
    @field:Relation(Relation.Kind.MANY_TO_ONE) var user: User,
) : Entity()