package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.ItemCommand
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.provided.authHeader
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.client.annotation.Client
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import java.time.ZoneId
import java.util.*

@MicronautTest(transactional = false)
class UserControllerTest(
    private val userRepo: UserRepository,
    private val userClient: UserClient,
    private val authClient: AuthClient
) : DescribeSpec({

        val testUsername = "admin"

        beforeTest {
            userRepo.deleteAll()
            userRepo.save(fakeUsers().getValue(testUsername))
        }

        describe("list locales") {
            val token = authHeader(authClient, testUsername)

            val resp = userClient.locales(token)
            resp.status() shouldBe HttpStatus.OK
            // Locales travel over JSON as BCP 47 language tags (Jackson 3), which does not
            // round-trip deprecated variants (e.g. no_NO_NY -> nn_NO), so compare tags.
            resp.body()?.map { it.toLanguageTag() } shouldBe
                Locale.getAvailableLocales().sortedBy { it.toLanguageTag() }.map { it.toLanguageTag() }
        }

        describe("list timezones") {
            val token = authHeader(authClient, testUsername)

            val resp = userClient.timezones(token)
            resp.status() shouldBe HttpStatus.OK
            resp.body() shouldBe ZoneId.getAvailableZoneIds().sorted()
        }

        describe("successfully password update") {
            val userId = userRepo.findByUsername(testUsername)?.id!!
            val token = authHeader(authClient, testUsername)
            val newPassword = "asdasd"

            val resp = userClient.password(token, userId, mapOf("password" to newPassword))
            resp.status() shouldBe HttpStatus.OK

            userRepo.findByUsername(testUsername)!!.checkPassword(newPassword) shouldBe true
        }

        describe("failed password update") {
            val userId = 9999L
            val token = authHeader(authClient, testUsername)

            val resp = userClient.password(token, userId, mapOf("password" to "asdasd"))
            resp.status() shouldBe HttpStatus.NOT_FOUND
        }
    })

@Client("/api/users")
interface UserClient {
    @Get("/locales")
    suspend fun locales(
        @Header(HttpHeaders.AUTHORIZATION) auth: String
    ): HttpResponse<List<Locale>>

    @Get("/timezones")
    suspend fun timezones(
        @Header(HttpHeaders.AUTHORIZATION) auth: String
    ): HttpResponse<List<String>>

    @Patch("/{id}/password")
    suspend fun password(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @PathVariable id: Long,
        @Body dto: Map<String, String>
    ): HttpResponse<ItemCommand>
}