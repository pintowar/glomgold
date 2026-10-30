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
    value = [
        Index(name = "category_user", columns = ["user_id"]),
        Index(name = "category_group", columns = ["group_id"])
    ]
)
@MappedEntity(value = "categories", namingStrategy = UnderScoreSeparatedLowerCase::class)
data class Category(
    @field:NotBlank var name: String,
    var color: String = "#6B7280",
    var isSystem: Boolean = false,
    @field:NotNull var userId: Long,
    var groupId: Long? = null
) : Entity()