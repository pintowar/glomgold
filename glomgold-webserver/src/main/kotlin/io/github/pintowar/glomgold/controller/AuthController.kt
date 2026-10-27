package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.security.utils.SecurityService

@Controller("/api/auth")
class AuthController(
    private val userRepository: UserRepository,
    private val securityService: SecurityService
) {
    @Get("/me")
    suspend fun panel(): Map<String, Any?> {
        val auth = securityService.authentication.orElseThrow()
        return userRepository.findByUsername(auth.name)?.let { user ->
            mapOf(
                "username" to user.username,
                "name" to user.name,
                "email" to user.email,
                "roles" to user.roles(),
                "userId" to user.id,
                "locale" to user.locale.toLanguageTag(),
                "currency" to auth.attributes["currency"],
                "symbol" to auth.attributes["symbol"]
            )
        } ?: emptyMap()
    }
}