package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.RefinePaginateQuery
import io.github.pintowar.glomgold.dto.UserCommand
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.provided.authHeader
import io.kotest.provided.fakeUsers
import io.micronaut.core.type.Argument
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.annotation.RequestBean
import io.micronaut.http.client.HttpClient
import io.micronaut.http.client.annotation.Client
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import io.mockk.mockk

@MicronautTest(transactional = false)
class UserControllerIndexTest(
    private val userRepo: UserRepository,
    private val userIndexClient: UserIndexClient,
    private val authClient: AuthClient,
    @Client("/") private val httpClient: HttpClient
) : DescribeSpec({

        beforeSpec {
            userRepo.deleteAll()
            fakeUsers().values.forEach { userRepo.save(it) }
        }

        describe("list users with id filter") {
            val token = authHeader(authClient, "admin")

            fun page() = RefinePaginateQuery(mockk<HttpRequest<Any>>(), 0, 25, "id", "ASC")

            it("returns all users without filter") {
                val resp = userIndexClient.index(token, page(), null)

                resp.status shouldBe HttpStatus.OK
                resp.body.get() shouldHaveSize 3
                resp.header("X-Total-Count") shouldBe "3"
            }

            it("returns single user for single id") {
                val id = userRepo.findByUsername("admin")?.id!!

                val resp = userIndexClient.index(token, page(), listOf(id))

                resp.status shouldBe HttpStatus.OK
                resp.body.get().map { it.id } shouldBe listOf(id)
            }

            it("returns matching users for multiple ids") {
                val ids =
                    listOf("admin", "donald").map { userRepo.findByUsername(it)?.id!! }

                // NB: the declarative client joins lists as `?id=1,2`, but simple-rest
                // sends repeated params (`?id=1&id=2`), so build that URI explicitly.
                val query = ids.joinToString("&") { "id=$it" }
                val req =
                    HttpRequest
                        .GET<Any>("/api/users?$query")
                        .header(HttpHeaders.AUTHORIZATION, token)
                val resp =
                    httpClient
                        .toBlocking()
                        .exchange(req, Argument.listOf(UserCommand::class.java))

                resp.status shouldBe HttpStatus.OK
                resp.body
                    .get()
                    .mapNotNull { it.id }
                    .sorted() shouldBe ids.sorted()
            }

            it("returns empty list for unknown id") {
                val resp = userIndexClient.index(token, page(), listOf(99999L))

                resp.status shouldBe HttpStatus.OK
                resp.body.get() shouldHaveSize 0
            }
        }
    })

@Client("/api/users")
interface UserIndexClient {
    @Get("/{?_start,_end,_sort,_order}")
    suspend fun index(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @RequestBean bean: RefinePaginateQuery,
        @QueryValue("id") id: List<Long>? = null
    ): HttpResponse<List<UserCommand>>
}