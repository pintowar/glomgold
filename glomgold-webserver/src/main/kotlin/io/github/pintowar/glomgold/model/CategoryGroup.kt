package io.github.pintowar.glomgold.model

import io.micronaut.core.annotation.ReflectiveAccess
import io.micronaut.data.annotation.Index
import io.micronaut.data.annotation.Indexes
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import jakarta.validation.constraints.NotBlank

@ReflectiveAccess
@Indexes(value = [Index(name = "category_group_user", columns = ["user_id"])])
@MappedEntity(value = "category_groups", namingStrategy = UnderScoreSeparatedLowerCase::class)
data class CategoryGroup(
    @field:NotBlank var name: String,
    var color: String = "#6B7280",
    var position: Int = 0,
    var isSystem: Boolean = false,
    var userId: Long
) : Entity()