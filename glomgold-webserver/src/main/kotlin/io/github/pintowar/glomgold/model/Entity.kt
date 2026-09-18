package io.github.pintowar.glomgold.model

import io.micronaut.data.annotation.DateCreated
import io.micronaut.data.annotation.DateUpdated
import io.micronaut.data.annotation.GeneratedValue
import io.micronaut.data.annotation.Id
import io.micronaut.data.annotation.Version
import java.time.Instant

open class Entity {
    @GeneratedValue(GeneratedValue.Type.SEQUENCE)
    @field:Id
    var id: Long? = null

    @field:Version
    var version: Int? = null

    @field:DateCreated
    var createdAt: Instant? = Instant.now()

    @field:DateUpdated
    var updatedAt: Instant? = Instant.now()
}