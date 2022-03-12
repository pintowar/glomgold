package com.github.pintowar.conf

import com.github.pintowar.model.User
import com.github.pintowar.repo.UserRepository
import io.micronaut.http.HttpRequest
import io.micronaut.security.authentication.AuthenticationProvider
import io.micronaut.security.authentication.AuthenticationRequest
import io.micronaut.security.authentication.AuthenticationResponse
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.reactive.asPublisher

@Singleton
class AuthenticationProviderUserPassword(private val userRepo: UserRepository) : AuthenticationProvider {

    override fun authenticate(
        httpRequest: HttpRequest<*>?, authenticationRequest: AuthenticationRequest<*, *>
    ) = flow {
        userRepo.findByUsername(authenticationRequest.identity.toString())?.let { user ->
            if (user.checkPassword(authenticationRequest.secret.toString())) {
                emit(response(user))
            } else fail("Invalid password.")
        } ?: fail("No user found!")
    }.asPublisher()

    private fun response(user: User) = AuthenticationResponse.success(user.username, user.roles(), user.attributes())

    private fun fail(message: String): Unit = throw AuthenticationResponse.exception(message)
}
