package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.maps.shouldContainKey
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders.AUTHORIZATION
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.Post
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.security.authentication.UsernamePasswordCredentials
import io.micronaut.security.token.render.BearerAccessRefreshToken

import io.micronaut.test.extensions.kotest5.annotation.MicronautTest

@MicronautTest(transactional = false)
class JwtAuthenticationTest(
    private val userRepo: UserRepository,
    private val authClient: AuthClient
) : DescribeSpec({

    beforeSpec {
        userRepo.deleteAll()
        userRepo.save(fakeUsers().getValue("admin"))
    }

    describe("authorization tests") {

        it("test access for unauthorized user") {
            val exception = shouldThrow<HttpClientResponseException> {
                authClient.account("some auth header")
            }

            exception.status shouldBe HttpStatus.UNAUTHORIZED
        }

        it("test access with wrong password") {
            val creds = UsernamePasswordCredentials("admin", "wrong-passwd")
            val exception = shouldThrow<HttpClientResponseException> {
                authClient.login(creds)
            }

            exception.status shouldBe HttpStatus.UNAUTHORIZED
            exception.message shouldBe "Invalid password."
        }

        it("test access for authorized user") {
            val creds = UsernamePasswordCredentials("admin", "admin")
            val bearerAccessRefreshToken = authClient.login(creds)

            bearerAccessRefreshToken.username shouldBe "admin"
            bearerAccessRefreshToken.accessToken.shouldNotBeNull()
            // JWTParser.parse(bearerAccessRefreshToken.accessToken) shouldBeType

            val result = authClient.account("Bearer ${bearerAccessRefreshToken.accessToken}")

            result shouldContainKey "username"
            result["username"] shouldBe "admin"
        }
    }
})

@Client("/")
interface AuthClient {

    @Post("/login")
    suspend fun login(@Body credentials: UsernamePasswordCredentials): BearerAccessRefreshToken

    @Get("/api/auth/me")
    fun account(@Header(AUTHORIZATION) authorization: String): Map<String, String>
}