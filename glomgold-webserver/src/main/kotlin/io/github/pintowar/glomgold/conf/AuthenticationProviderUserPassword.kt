package io.github.pintowar.glomgold.conf

import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.UserRepository
import io.micronaut.http.HttpRequest
import io.micronaut.security.authentication.AuthenticationRequest
import io.micronaut.security.authentication.AuthenticationResponse
import io.micronaut.security.authentication.provider.HttpRequestReactiveAuthenticationProvider
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.reactive.asPublisher

@Singleton
class AuthenticationProviderUserPassword(
    private val userRepo: UserRepository
) : HttpRequestReactiveAuthenticationProvider<Any> {
    override fun authenticate(
        httpRequest: HttpRequest<Any>?,
        authenticationRequest: AuthenticationRequest<String, String>
    ) = flow {
        userRepo.findByUsername(authenticationRequest.identity.toString())?.let { user ->
            when {
                !user.enabled -> fail("User disabled!")
                user.checkPassword(authenticationRequest.secret.toString()) -> emit(response(user))
                else -> fail("Invalid password.")
            }
        } ?: fail("No user found!")
    }.asPublisher()

    private fun response(user: User) = AuthenticationResponse.success(user.username, user.roles(), user.attributes())

    private fun fail(message: String): Unit = throw AuthenticationResponse.exception(message)
}