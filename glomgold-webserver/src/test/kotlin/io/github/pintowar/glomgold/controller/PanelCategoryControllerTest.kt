package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.CategoryCommand
import io.github.pintowar.glomgold.dto.CategoryGroupCommand
import io.github.pintowar.glomgold.dto.CategoryUsage
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountType
import io.github.pintowar.glomgold.model.Category
import io.github.pintowar.glomgold.model.CategoryGroup
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
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import java.math.BigDecimal
import java.time.YearMonth

@MicronautTest(transactional = false)
class PanelCategoryControllerTest(
    private val userRepo: UserRepository,
    private val accountRepo: AccountRepository,
    private val itemRepo: ItemRepository,
    private val categoryRepo: CategoryRepository,
    private val groupRepo: CategoryGroupRepository,
    private val authClient: AuthClient,
    private val panelClient: PanelCategoryClient
) : DescribeSpec({

        val users = HashMap<String, User>()
        val accounts = HashMap<String, Account>()

        beforeSpec {
            itemRepo.deleteAll()
            categoryRepo.deleteAll()
            groupRepo.deleteAll()
            accountRepo.deleteAll()
            userRepo.deleteAll()
            listOf("admin", "donald")
                .associateWith { userRepo.save(fakeUsers().getValue(it)) }
                .forEach { (username, user) ->
                    users[username] = user
                    accounts[username] = accountRepo.save(Account("Checking", "USD", AccountType.CHECKING, user.id!!))
                }
        }

        beforeEach {
            itemRepo.deleteAll()
            categoryRepo.deleteAll()
            groupRepo.deleteAll()
        }

        suspend fun categoryOf(
            username: String,
            name: String,
            groupId: Long? = null
        ) = categoryRepo.save(Category(name, userId = users.getValue(username).id!!, groupId = groupId))

        suspend fun groupOf(
            username: String,
            name: String
        ) = groupRepo.save(CategoryGroup(name, userId = users.getValue(username).id!!))

        suspend fun itemOf(
            username: String,
            categoryId: Long
        ) = itemRepo.save(
            Item(
                "Test",
                BigDecimal.TEN,
                ItemType.EXPENSE,
                YearMonth.now(),
                users.getValue(username).id!!,
                accounts.getValue(username).id!!,
                categoryId = categoryId
            )
        )

        describe("listing") {
            it("lists only the caller's categories and groups") {
                categoryOf("admin", "Housing")
                categoryOf("donald", "Moradia")
                groupOf("admin", "Admin group")
                groupOf("donald", "Donald group")
                val donaldToken = authCookie(authClient, "donald")

                panelClient
                    .listCategories(donaldToken)
                    .body
                    .get()
                    .map { it.name } shouldBe listOf("Moradia")
                panelClient
                    .listGroups(donaldToken)
                    .body
                    .get()
                    .map { it.name } shouldBe listOf("Donald group")
            }

            it("rejects unauthenticated access") {
                shouldThrow<HttpClientResponseException> {
                    panelClient.listCategories("glomgold-auth=invalid")
                }.status shouldBe HttpStatus.UNAUTHORIZED
            }
        }

        describe("category ownership") {
            it("creates for the caller and ignores submitted owner and system flags") {
                val donaldToken = authCookie(authClient, "donald")
                val group = groupOf("donald", "Home")

                val created =
                    panelClient
                        .createCategory(
                            donaldToken,
                            CategoryCommand(
                                name = " Food ",
                                color = "#123456",
                                isSystem = true,
                                userId = users.getValue("admin").id,
                                groupId = group.id
                            )
                        ).body
                        .get()

                created.name shouldBe "Food"
                created.color shouldBe "#123456"
                created.userId shouldBe users.getValue("donald").id
                created.isSystem shouldBe false
                created.groupId shouldBe group.id

                panelClient
                    .readCategory(donaldToken, created.id!!)
                    .body
                    .get()
                    .name shouldBe "Food"

                val updated =
                    panelClient
                        .updateCategory(
                            donaldToken,
                            created.id,
                            CategoryCommand(name = "Comida", color = "#654321", groupId = null)
                        ).body
                        .get()

                updated.name shouldBe "Comida"
                updated.color shouldBe "#654321"
                updated.groupId shouldBe null
                updated.isSystem shouldBe false
            }

            it("deletes a category") {
                val donaldToken = authCookie(authClient, "donald")
                val category = categoryOf("donald", "Moradia")

                panelClient.deleteCategory(donaldToken, category.id!!).status shouldBe HttpStatus.OK

                categoryRepo.findById(category.id!!).shouldBeNull()
            }

            it("rejects a group owned by another user") {
                val donaldToken = authCookie(authClient, "donald")
                val adminGroup = groupOf("admin", "Admin group")
                val category = categoryOf("donald", "Moradia")

                shouldThrow<HttpClientResponseException> {
                    panelClient
                        .createCategory(donaldToken, CategoryCommand(name = "Mine", groupId = adminGroup.id))
                }.status shouldBe HttpStatus.BAD_REQUEST
                shouldThrow<HttpClientResponseException> {
                    panelClient
                        .updateCategory(
                            donaldToken,
                            category.id!!,
                            CategoryCommand(name = "Mine", groupId = adminGroup.id)
                        )
                }.status shouldBe HttpStatus.BAD_REQUEST
            }

            it("hides another user's categories") {
                val donaldToken = authCookie(authClient, "donald")
                val adminCategory = categoryOf("admin", "Housing")

                panelClient.readCategory(donaldToken, adminCategory.id!!).status shouldBe HttpStatus.NOT_FOUND
                panelClient
                    .updateCategory(donaldToken, adminCategory.id!!, CategoryCommand(name = "Hacked"))
                    .status shouldBe HttpStatus.NOT_FOUND
                panelClient.deleteCategory(donaldToken, adminCategory.id!!).status shouldBe HttpStatus.NOT_FOUND
                panelClient.categoryUsage(donaldToken, adminCategory.id!!).status shouldBe HttpStatus.NOT_FOUND
                categoryRepo.findById(adminCategory.id!!).shouldNotBeNull()
            }
        }

        describe("usage and deletion") {
            it("counts the caller's items") {
                val donaldToken = authCookie(authClient, "donald")
                val category = categoryOf("donald", "Rent")
                val categoryId = category.id!!
                itemOf("donald", categoryId)

                panelClient.categoryUsage(donaldToken, categoryId).body.get() shouldBe CategoryUsage(categoryId, 1)
            }

            it("refuses to delete without a destination and transfers items when given") {
                val donaldToken = authCookie(authClient, "donald")
                val from = categoryOf("donald", "Groceries")
                val sourceId = from.id!!
                val targetId = categoryOf("donald", "Food").id!!
                val item = itemOf("donald", sourceId)

                shouldThrow<HttpClientResponseException> {
                    panelClient.deleteCategory(donaldToken, sourceId)
                }.status shouldBe HttpStatus.CONFLICT
                categoryRepo.findById(sourceId).shouldNotBeNull()

                panelClient.deleteCategoryWithTransfer(donaldToken, sourceId, targetId).status shouldBe HttpStatus.OK
                itemRepo.findById(item.id!!)!!.categoryId shouldBe targetId
                categoryRepo.findById(sourceId).shouldBeNull()
            }

            it("rejects self, unknown and foreign transfer targets") {
                val donaldToken = authCookie(authClient, "donald")
                val categoryId = categoryOf("donald", "Groceries").id!!
                val adminCategoryId = categoryOf("admin", "Housing").id!!
                itemOf("donald", categoryId)

                shouldThrow<HttpClientResponseException> {
                    panelClient.deleteCategoryWithTransfer(donaldToken, categoryId, categoryId)
                }.status shouldBe HttpStatus.BAD_REQUEST
                shouldThrow<HttpClientResponseException> {
                    panelClient.deleteCategoryWithTransfer(donaldToken, categoryId, adminCategoryId)
                }.status shouldBe HttpStatus.BAD_REQUEST
                shouldThrow<HttpClientResponseException> {
                    panelClient.deleteCategoryWithTransfer(donaldToken, categoryId, Long.MAX_VALUE)
                }.status shouldBe HttpStatus.BAD_REQUEST
                categoryRepo.findById(categoryId).shouldNotBeNull()
            }
        }

        describe("groups") {
            it("creates for the caller and updates") {
                val donaldToken = authCookie(authClient, "donald")

                val created =
                    panelClient
                        .createCategoryGroup(
                            donaldToken,
                            CategoryGroupCommand(name = " Home ", userId = users.getValue("admin").id, isSystem = true)
                        ).body
                        .get()

                created.name shouldBe "Home"
                created.userId shouldBe users.getValue("donald").id
                created.isSystem shouldBe false
                panelClient
                    .readGroup(donaldToken, created.id!!)
                    .body
                    .get()
                    .name shouldBe "Home"

                val updated =
                    panelClient
                        .updateCategoryGroup(
                            donaldToken,
                            created.id,
                            CategoryGroupCommand(name = "House", color = "#ABCDEF", position = 2)
                        ).body
                        .get()

                updated.name shouldBe "House"
                updated.color shouldBe "#ABCDEF"
                updated.position shouldBe 2
            }

            it("deletes a group and ungroups its categories") {
                val donaldToken = authCookie(authClient, "donald")
                val group = groupOf("donald", "Home")
                val category = categoryOf("donald", "Rent", group.id)

                panelClient.deleteGroup(donaldToken, group.id!!).status shouldBe HttpStatus.OK

                groupRepo.findById(group.id!!).shouldBeNull()
                categoryRepo.findById(category.id!!)!!.groupId shouldBe null
            }

            it("hides another user's groups") {
                val donaldToken = authCookie(authClient, "donald")
                val adminGroup = groupOf("admin", "Admin group")

                panelClient.readGroup(donaldToken, adminGroup.id!!).status shouldBe HttpStatus.NOT_FOUND
                panelClient
                    .updateCategoryGroup(donaldToken, adminGroup.id!!, CategoryGroupCommand(name = "Hacked"))
                    .status shouldBe HttpStatus.NOT_FOUND
                panelClient.deleteGroup(donaldToken, adminGroup.id!!).status shouldBe HttpStatus.NOT_FOUND
                panelClient.listGroups(donaldToken).body.get() shouldHaveSize 0
                groupRepo.findById(adminGroup.id!!).shouldNotBeNull()
            }
        }
    })

@Client("/api/panel")
interface PanelCategoryClient {
    @Get("/categories")
    suspend fun listCategories(
        @Header(HttpHeaders.COOKIE) auth: String
    ): HttpResponse<List<CategoryCommand>>

    @Get("/categories/{id}")
    suspend fun readCategory(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<CategoryCommand>

    @Post("/categories")
    suspend fun createCategory(
        @Header(HttpHeaders.COOKIE) auth: String,
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand>

    @Patch("/categories/{id}")
    suspend fun updateCategory(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long,
        @Body dto: CategoryCommand
    ): HttpResponse<CategoryCommand>

    @Delete("/categories/{id}")
    suspend fun deleteCategory(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<Unit>

    @Delete("/categories/{id}{?transferTo}")
    suspend fun deleteCategoryWithTransfer(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long,
        @QueryValue transferTo: Long
    ): HttpResponse<Unit>

    @Get("/categories/usage/{id}")
    suspend fun categoryUsage(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<CategoryUsage>

    @Get("/category-groups")
    suspend fun listGroups(
        @Header(HttpHeaders.COOKIE) auth: String
    ): HttpResponse<List<CategoryGroupCommand>>

    @Get("/category-groups/{id}")
    suspend fun readGroup(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<CategoryGroupCommand>

    @Post("/category-groups")
    suspend fun createCategoryGroup(
        @Header(HttpHeaders.COOKIE) auth: String,
        @Body dto: CategoryGroupCommand
    ): HttpResponse<CategoryGroupCommand>

    @Patch("/category-groups/{id}")
    suspend fun updateCategoryGroup(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long,
        @Body dto: CategoryGroupCommand
    ): HttpResponse<CategoryGroupCommand>

    @Delete("/category-groups/{id}")
    suspend fun deleteGroup(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<Unit>
}