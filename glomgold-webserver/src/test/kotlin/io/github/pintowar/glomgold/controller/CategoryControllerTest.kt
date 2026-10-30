package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.CategoryCommand
import io.github.pintowar.glomgold.dto.CategoryGroupCommand
import io.github.pintowar.glomgold.dto.CategoryUsage
import io.github.pintowar.glomgold.dto.ItemCommand
import io.github.pintowar.glomgold.dto.RefinePaginateQuery
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountType
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.ItemType
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.CategoryGroupRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.kotest.provided.authCookie
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.annotation.RequestBean
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import java.math.BigDecimal
import java.time.YearMonth

@MicronautTest(transactional = false)
class CategoryControllerTest(
    private val userRepo: UserRepository,
    private val accountRepo: AccountRepository,
    private val itemRepo: ItemRepository,
    private val categoryRepo: CategoryRepository,
    private val groupRepo: CategoryGroupRepository,
    private val authClient: AuthClient,
    private val categoryClient: CategoryClient,
    private val groupClient: CategoryGroupClient,
    private val itemClient: ItemClient
) : DescribeSpec({

        val users = HashMap<String, User>()
        var accountId = 0L

        beforeSpec {
            itemRepo.deleteAll()
            categoryRepo.deleteAll()
            groupRepo.deleteAll()
            accountRepo.deleteAll()
            userRepo.deleteAll()
            listOf("admin", "donald")
                .associateWith { userRepo.save(fakeUsers().getValue(it)) }
                .forEach { (username, user) -> users[username] = user }
            accountId =
                accountRepo.save(Account("Checking", "USD", AccountType.CHECKING, users.getValue("admin").id!!)).id!!
        }

        beforeEach {
            itemRepo.deleteAll()
            categoryRepo.deleteAll()
            groupRepo.deleteAll()
        }

        fun page() = RefinePaginateQuery(HttpRequest.GET("/api/categories"), 0, 25, "id", "ASC")

        describe("listing") {
            it("is restricted to admins") {
                val donaldToken = authCookie(authClient, "donald")

                shouldThrow<HttpClientResponseException> {
                    categoryClient.list(donaldToken, page())
                }.status shouldBe HttpStatus.FORBIDDEN
            }

            it("lists every user's categories for an admin") {
                val adminToken = authCookie(authClient, "admin")

                categoryClient.create(adminToken, CategoryCommand(name = "Housing"))
                categoryClient
                    .create(adminToken, CategoryCommand(name = "Moradia", userId = users.getValue("donald").id))
                categoryClient.list(adminToken, page()).body.get() shouldHaveSize 2
            }
        }

        describe("crud") {
            it("creates, reads, updates and deletes a category") {
                val adminToken = authCookie(authClient, "admin")

                val created =
                    categoryClient.create(adminToken, CategoryCommand(name = "Food", color = "#123456")).body.get()
                created.name shouldBe "Food"
                created.color shouldBe "#123456"
                created.userId shouldBe users.getValue("admin").id

                categoryClient
                    .read(adminToken, created.id!!)
                    .body
                    .get()
                    .name shouldBe "Food"
                categoryClient
                    .update(adminToken, created.id, CategoryCommand(name = "Comida"))
                    .body
                    .get()
                    .name shouldBe "Comida"
                categoryClient.delete(adminToken, created.id).status shouldBe HttpStatus.OK
            }

            it("is restricted to admins") {
                val donaldToken = authCookie(authClient, "donald")

                shouldThrow<HttpClientResponseException> {
                    categoryClient.create(donaldToken, CategoryCommand(name = "Food"))
                }.status shouldBe HttpStatus.FORBIDDEN
            }

            it("lets an admin create a category for another user") {
                val adminToken = authCookie(authClient, "admin")
                val donaldId = users.getValue("donald").id

                val created =
                    categoryClient
                        .create(adminToken, CategoryCommand(name = "Carteira", userId = donaldId))
                        .body
                        .get()

                created.userId shouldBe donaldId
            }

            it("rejects a group owned by another user") {
                val adminToken = authCookie(authClient, "admin")
                val adminGroup = groupClient.create(adminToken, CategoryGroupCommand(name = "Admin")).body.get()

                shouldThrow<HttpClientResponseException> {
                    categoryClient.create(
                        adminToken,
                        CategoryCommand(name = "Mine", groupId = adminGroup.id, userId = users.getValue("donald").id)
                    )
                }.status shouldBe HttpStatus.BAD_REQUEST
            }
        }

        describe("usage and deletion") {
            it("counts referencing items") {
                val adminToken = authCookie(authClient, "admin")
                val donaldId = users.getValue("donald").id!!
                val category =
                    categoryClient.create(adminToken, CategoryCommand(name = "Rent", userId = donaldId)).body.get()
                itemRepo.save(
                    Item(
                        "Rent",
                        BigDecimal.TEN,
                        ItemType.EXPENSE,
                        YearMonth.now(),
                        donaldId,
                        accountId,
                        categoryId = category.id
                    )
                )

                categoryClient.usage(adminToken, category.id!!).body.get() shouldBe CategoryUsage(category.id, 1)
            }

            it("refuses to delete without a destination and transfers items when given") {
                val adminToken = authCookie(authClient, "admin")
                val adminId = users.getValue("admin").id!!
                val from = categoryClient.create(adminToken, CategoryCommand(name = "Groceries")).body.get()
                val to = categoryClient.create(adminToken, CategoryCommand(name = "Food")).body.get()
                val item =
                    itemRepo.save(
                        Item(
                            "Market",
                            BigDecimal.TEN,
                            ItemType.EXPENSE,
                            YearMonth.now(),
                            adminId,
                            accountId,
                            categoryId = from.id
                        )
                    )

                shouldThrow<HttpClientResponseException> {
                    categoryClient.delete(adminToken, from.id!!)
                }.status shouldBe HttpStatus.CONFLICT

                categoryClient.deleteWithTransfer(adminToken, from.id!!, to.id!!).status shouldBe HttpStatus.OK
                itemRepo.findById(item.id!!)!!.categoryId shouldBe to.id
                categoryRepo.findById(from.id!!).shouldBeNull()
            }

            it("rejects a transfer target owned by another user") {
                val adminToken = authCookie(authClient, "admin")
                val adminId = users.getValue("admin").id!!
                val from = categoryClient.create(adminToken, CategoryCommand(name = "Groceries")).body.get()
                val donaldCategory =
                    categoryClient
                        .create(
                            adminToken,
                            CategoryCommand(name = "Moradia", userId = users.getValue("donald").id)
                        ).body
                        .get()
                itemRepo.save(
                    Item(
                        "Market",
                        BigDecimal.TEN,
                        ItemType.EXPENSE,
                        YearMonth.now(),
                        adminId,
                        accountId,
                        categoryId = from.id
                    )
                )

                shouldThrow<HttpClientResponseException> {
                    categoryClient.deleteWithTransfer(adminToken, from.id!!, donaldCategory.id!!)
                }.status shouldBe HttpStatus.BAD_REQUEST
                categoryRepo.findById(from.id!!).shouldNotBeNull()
            }
        }

        describe("item binding") {
            it("rejects a category owned by another user") {
                val adminToken = authCookie(authClient, "admin")
                val donaldCategory =
                    categoryClient
                        .create(
                            adminToken,
                            CategoryCommand(name = "Moradia", userId = users.getValue("donald").id)
                        ).body
                        .get()

                shouldThrow<HttpClientResponseException> {
                    itemClient.create(
                        adminToken,
                        ItemCommand(
                            description = "Stolen",
                            value = 10.0,
                            itemType = ItemType.EXPENSE,
                            year = 2026,
                            month = 1,
                            userId = users.getValue("admin").id!!,
                            accountId = accountId,
                            categoryId = donaldCategory.id
                        )
                    )
                }.status shouldBe HttpStatus.BAD_REQUEST
            }
        }

        describe("security") {
            it("rejects unauthenticated access") {
                shouldThrow<HttpClientResponseException> {
                    categoryClient.list("glomgold-auth=invalid", page())
                }.status shouldBe HttpStatus.UNAUTHORIZED
            }
        }
    })

@Client("/api/categories")
interface CategoryClient {
    @Get("/{?_start,_end,_sort,_order}")
    suspend fun list(
        @Header(HttpHeaders.COOKIE) auth: String,
        @RequestBean pagination: RefinePaginateQuery
    ): HttpResponse<List<CategoryCommand>>

    @Get("/{id}")
    suspend fun read(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<CategoryCommand>

    @Post("/")
    suspend fun create(
        @Header(HttpHeaders.COOKIE) auth: String,
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand>

    @Patch("/{id}")
    suspend fun update(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long,
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand>

    @Delete("/{id}")
    suspend fun delete(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<Int>

    @Delete("/{id}{?transferTo}")
    suspend fun deleteWithTransfer(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long,
        @QueryValue transferTo: Long
    ): HttpResponse<Int>

    @Get("/usage/{id}")
    suspend fun usage(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<CategoryUsage>
}

@Client("/api/category-groups")
interface CategoryGroupClient {
    @Get("/{?_start,_end,_sort,_order}")
    suspend fun list(
        @Header(HttpHeaders.COOKIE) auth: String,
        @RequestBean pagination: RefinePaginateQuery
    ): HttpResponse<List<CategoryGroupCommand>>

    @Get("/{id}")
    suspend fun read(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<CategoryGroupCommand>

    @Post("/")
    suspend fun create(
        @Header(HttpHeaders.COOKIE) auth: String,
        @Body dto: CategoryGroupCommand
    ): HttpResponse<CategoryGroupCommand>

    @Patch("/{id}")
    suspend fun update(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long,
        @Body dto: CategoryGroupCommand
    ): HttpResponse<CategoryGroupCommand>

    @Delete("/{id}")
    suspend fun delete(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<Int>
}