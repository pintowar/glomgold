package io.github.pintowar.glomgold.conf

import io.micronaut.core.annotation.ReflectionConfig
import io.micronaut.core.annotation.TypeHint
import io.micronaut.security.authentication.UsernamePasswordCredentials
import io.micronaut.security.token.render.AccessRefreshToken
import io.micronaut.security.token.render.BearerAccessRefreshToken

@TypeHint(
    value = [
        UsernamePasswordCredentials::class,
        AccessRefreshToken::class,
        BearerAccessRefreshToken::class
    ],
    accessType = [
        TypeHint.AccessType.ALL_DECLARED_CONSTRUCTORS,
        TypeHint.AccessType.ALL_DECLARED_METHODS,
        TypeHint.AccessType.ALL_DECLARED_FIELDS
    ]
)
@ReflectionConfig(
    type = kotlin.Unit::class,
    fields = [ReflectionConfig.ReflectiveFieldConfig(name = "INSTANCE")]
)
class GraalReflectionConfig