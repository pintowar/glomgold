package io.github.pintowar.glomgold.model

import io.micronaut.data.annotation.Index
import io.micronaut.data.annotation.Indexes
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.annotation.TypeDef
import io.micronaut.data.model.DataType
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.YearMonth

@Indexes(
    Index(name = "item_period_user", columns = ["period", "user_id"])
)
@MappedEntity(value = "items", namingStrategy = UnderScoreSeparatedLowerCase::class)
data class Item(
    @field:NotBlank var description: String,
    var value: BigDecimal,
    @field:TypeDef(type = DataType.TIMESTAMP) var period: YearMonth,
    @field:NotNull var userId: Long
) : Entity()