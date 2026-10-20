package io.github.pintowar.glomgold.model

import io.micronaut.core.annotation.ReflectiveAccess
import io.micronaut.data.annotation.Index
import io.micronaut.data.annotation.Indexes
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull

@ReflectiveAccess
@Indexes(
    Index(name = "account_user", columns = ["user_id"])
)
@MappedEntity(value = "accounts", namingStrategy = UnderScoreSeparatedLowerCase::class)
data class Account(
    @field:NotBlank var name: String,
    @field:NotBlank var currency: String,
    var type: AccountType = AccountType.CHECKING,
    @field:NotNull var userId: Long
) : Entity()