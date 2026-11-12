package io.github.pintowar.glomgold.repository

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
import io.github.pintowar.glomgold.service.CategorySeedService
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.micronaut.data.event.PersistenceEventException
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import jakarta.validation.ConstraintViolationException
import kotlinx.coroutines.flow.first
import java.math.BigDecimal
import java.time.YearMonth

@MicronautTest(transactional = false)
class UserRepositoryTest(
    private val userRepo: UserRepository,
    private val accountRepo: AccountRepository,
    private val categorySeedService: CategorySeedService,
    private val categoryRepo: CategoryRepository,
    private val categoryGroupRepo: CategoryGroupRepository,
    private val itemRepo: ItemRepository
) : DescribeSpec({

        beforeEach {
            itemRepo.deleteAll()
            accountRepo.deleteAll()
            userRepo.deleteAll()
        }

        suspend fun newUser() =
            userRepo.save(
                User(
                    username = "admin",
                    name = "Administrator",
                    email = "admin@glomgold.com"
                ).apply { applyPassword("admin") }
            )

        suspend fun newAccount(userId: Long) =
            accountRepo.save(Account("Checking", "USD", AccountType.CHECKING, userId))

        suspend fun newItem(
            userId: Long,
            accountId: Long,
            categoryId: Long? = null
        ) = itemRepo.save(
            Item(
                description = "Water",
                value = BigDecimal(10),
                itemType = ItemType.EXPENSE,
                period = YearMonth.now(),
                userId = userId,
                accountId = accountId,
                categoryId = categoryId
            )
        )

        suspend fun assertRowCounts(
            users: Long,
            accounts: Long,
            items: Long,
            categories: Long,
            groups: Long
        ) {
            userRepo.count() shouldBe users
            accountRepo.count() shouldBe accounts
            itemRepo.count() shouldBe items
            categoryRepo.count() shouldBe categories
            categoryGroupRepo.count() shouldBe groups
        }

        describe("user operations") {

            it("persists a valid user") {
                val savedUser = newUser()
                savedUser.id.shouldNotBeNull()
                savedUser.username shouldBe "admin"
            }

            it("rejects a user without username and name") {
                val user =
                    User(
                        username = "",
                        name = "",
                        email = "admin@glomgold.com"
                    )
                val exception =
                    shouldThrow<PersistenceEventException> {
                        userRepo.save(user)
                    }.cause as ConstraintViolationException
                exception.constraintViolations.size shouldBe 3
            }

            it("checks the password") {
                newUser()

                val admin = userRepo.findByUsername("admin").shouldNotBeNull()
                admin.checkPassword("admin") shouldBe true
                admin.checkPassword("other") shouldBe false
            }
        }

        describe("item operations") {

            it("persists an item") {
                val user = newUser()
                val account = newAccount(user.id!!)

                val savedItem = newItem(user.id!!, account.id!!)
                savedItem.id.shouldNotBeNull()
                savedItem.description shouldBe "Water"
            }
        }

        describe("cascade delete") {

            it("deletes everything owned by the user") {
                val user = newUser()
                categorySeedService.seedDefaults(user)
                val account = newAccount(user.id!!)
                newItem(user.id!!, account.id!!)

                assertRowCounts(users = 1, accounts = 1, items = 1, categories = 24, groups = 6)

                userRepo.delete(user)

                assertRowCounts(users = 0, accounts = 0, items = 0, categories = 0, groups = 0)
            }

            it("deletes the categories of a deleted group and keeps their items") {
                val user = newUser()
                categorySeedService.seedDefaults(user)
                val category = categoryRepo.findAll().first()
                val account = newAccount(user.id!!)
                newItem(user.id!!, account.id!!, category.id)

                assertRowCounts(users = 1, accounts = 1, items = 1, categories = 24, groups = 6)

                categoryGroupRepo.deleteById(category.groupId!!)

                categoryRepo.findById(category.id!!) shouldBe null
                itemRepo.count() shouldBe 1
            }
        }
    })