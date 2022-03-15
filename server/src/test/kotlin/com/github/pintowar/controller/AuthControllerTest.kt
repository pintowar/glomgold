package com.github.pintowar.controller

import com.github.pintowar.model.User
import com.github.pintowar.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.maps.shouldContainKey
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.micronaut.http.HttpHeaders.AUTHORIZATION
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.Post
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.security.authentication.UsernamePasswordCredentials
import io.micronaut.security.token.jwt.render.BearerAccessRefreshToken
import io.micronaut.test.extensions.kotest.annotation.MicronautTest
import java.time.ZoneId
import java.util.*

@MicronautTest
class JwtAuthenticationTest(
    private val userRepo: UserRepository,
    private val panelClient: PanelClient
) : DescribeSpec({

    beforeSpec {
        userRepo.deleteAll()
        val user = User(
            username = "admin",
            name = "Administrator",
            email = "admin@glomgold.com",
            locale = Locale.US,
            timezone = ZoneId.of("UTC")
        ).apply { setPassword("admin") }
        userRepo.save(user)
    }

    describe("authorization tests") {

        it("test access for unauthorized user") {
            val exception = shouldThrow<HttpClientResponseException> {
                panelClient.account("some auth header")
            }

            exception.status shouldBe HttpStatus.UNAUTHORIZED
        }

        it("test access for authorized user") {
            val creds = UsernamePasswordCredentials("admin", "admin")
            val bearerAccessRefreshToken = panelClient.login(creds)

            bearerAccessRefreshToken.username shouldBe "admin"
            bearerAccessRefreshToken.accessToken.shouldNotBeNull()
            // JWTParser.parse(bearerAccessRefreshToken.accessToken) shouldBeType

            val result = panelClient.account("Bearer ${bearerAccessRefreshToken.accessToken}")

            result shouldContainKey "username"
            result["username"] shouldBe "admin"
        }
    }
})

@Client("/")
interface PanelClient {

    @Post("/login")
    fun login(@Body credentials: UsernamePasswordCredentials): BearerAccessRefreshToken

    @Get("/api/auth/me")
    fun account(@Header(AUTHORIZATION) authorization: String): Map<String, String>
}