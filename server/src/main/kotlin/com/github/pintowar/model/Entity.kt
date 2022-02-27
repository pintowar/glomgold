package com.github.pintowar.model

import io.micronaut.data.annotation.*
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