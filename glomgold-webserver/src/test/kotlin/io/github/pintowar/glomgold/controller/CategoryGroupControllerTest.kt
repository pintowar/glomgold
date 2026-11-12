package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.CategoryGroupCommand
import io.github.pintowar.glomgold.dto.RefinePaginateQuery
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountType
import io.github.pintowar.glomgold.model.Category
import io.github.pintowar.glomgold.model.CategoryGroup
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.ItemType
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.CategoryGroupRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.shouldBe
import io.kotest.provided.authCookie
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpStatus
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import java.math.BigDecimal
import java.time.YearMonth

@MicronautTest(transactional = false)
class CategoryGroupControllerTest(
    private val userRepo: UserRepository,
    private val accountRepo: AccountRepository,
    private val itemRepo: ItemRepository,
    private val categoryRepo: CategoryRepository,
    private val groupRepo: CategoryGroupRepository,
    private val authClient: AuthClient,
    private val groupClient: CategoryGroupClient
) : DescribeSpec({

        var adminId = 0L
        var donaldId = 0L

        beforeSpec {
            itemRepo.deleteAll()
            categoryRepo.deleteAll()
            groupRepo.deleteAll()
            adminId = (userRepo.findByUsername("admin") ?: userRepo.save(fakeUsers().getValue("admin"))).id!!
            donaldId = (userRepo.findByUsername("donald") ?: userRepo.save(fakeUsers().getValue("donald"))).id!!
        }

        beforeEach {
            itemRepo.deleteAll()
            categoryRepo.deleteAll()
            groupRepo.deleteAll()
        }

        fun page() = RefinePaginateQuery(HttpRequest.GET("/api/category-groups"), 0, 25, "id", "ASC")

        describe("crud") {
            it("creates a group owned by the caller when userId is blank") {
                val adminToken = authCookie(authClient, "admin")

                val created = groupClient.create(adminToken, CategoryGroupCommand(name = "Housing")).body.get()

                created.name shouldBe "Housing"
                created.userId shouldBe adminId
            }

            it("lets an admin create a group for another user") {
                val adminToken = authCookie(authClient, "admin")

                val created =
                    groupClient
                        .create(adminToken, CategoryGroupCommand(name = "Donald", userId = donaldId))
                        .body
                        .get()

                created.userId shouldBe donaldId
            }

            it("lists groups") {
                val adminToken = authCookie(authClient, "admin")
                groupClient.create(adminToken, CategoryGroupCommand(name = "Housing"))
                groupClient.create(adminToken, CategoryGroupCommand(name = "Food"))

                groupClient.list(adminToken, page()).body.get() shouldHaveSize 2
            }

            it("updates name, color and position without touching the owner or isSystem") {
                val adminToken = authCookie(authClient, "admin")
                val group =
                    groupRepo.save(
                        CategoryGroup("Housing", color = "#000000", position = 1, isSystem = true, userId = donaldId)
                    )

                val updated =
                    groupClient
                        .update(
                            adminToken,
                            group.id!!,
                            CategoryGroupCommand(name = "  Casa  ", color = "#112233", position = 3)
                        ).body
                        .get()

                updated.name shouldBe "Casa"
                updated.color shouldBe "#112233"
                updated.position shouldBe 3
                updated.userId shouldBe donaldId
                updated.isSystem shouldBe true
            }

            it("returns not found for an unknown group") {
                val adminToken = authCookie(authClient, "admin")

                groupClient.read(adminToken, 999L).status shouldBe HttpStatus.NOT_FOUND
            }
        }

        describe("deletion") {
            it("deletes its categories on delete and keeps their items") {
                val adminToken = authCookie(authClient, "admin")
                val group = groupClient.create(adminToken, CategoryGroupCommand(name = "Housing")).body.get()
                val category = categoryRepo.save(Category("Rent", userId = adminId, groupId = group.id))
                val account = accountRepo.save(Account("Checking", "USD", AccountType.CHECKING, adminId))
                val item =
                    itemRepo.save(
                        Item(
                            description = "Rent",
                            value = BigDecimal.TEN,
                            itemType = ItemType.EXPENSE,
                            period = YearMonth.now(),
                            userId = adminId,
                            accountId = account.id!!,
                            categoryId = category.id
                        )
                    )

                groupClient.delete(adminToken, group.id!!).status shouldBe HttpStatus.OK

                groupRepo.findById(group.id).shouldBeNull()
                categoryRepo.findById(category.id!!) shouldBe null
                itemRepo.findById(item.id!!)!!.categoryId.shouldBeNull()
            }
        }

        describe("security") {
            it("is restricted to admins") {
                val donaldToken = authCookie(authClient, "donald")

                shouldThrow<HttpClientResponseException> {
                    groupClient.list(donaldToken, page())
                }.status shouldBe HttpStatus.FORBIDDEN
            }

            it("rejects unauthenticated access") {
                shouldThrow<HttpClientResponseException> {
                    groupClient.list("glomgold-auth=invalid", page())
                }.status shouldBe HttpStatus.UNAUTHORIZED
            }
        }
    })