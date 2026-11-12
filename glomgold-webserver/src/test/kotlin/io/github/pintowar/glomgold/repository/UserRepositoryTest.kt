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
import kotlinx.coroutines.flow.toList
import java.math.BigDecimal
import java.time.YearMonth

@MicronautTest(transactional = false)
class UserRepositoryTest(
    private val userRepo: UserRepository,
    private val accountRepo: AccountRepository,
    private val categorySeedService: CategorySeedService,
    private val categoryRepo: CategoryRepository,
    private val categoryGroupRepository: CategoryGroupRepository,
    private val itemRepo: ItemRepository
) : DescribeSpec({

        beforeEach {
            itemRepo.deleteAll()
            accountRepo.deleteAll()
            userRepo.deleteAll()
        }

        describe("user operations") {

            it("successful persist user") {
                val user =
                    User(
                        username = "admin",
                        name = "Administrator",
                        email = "admin@glomgold.com"
                    ).apply { applyPassword("admin") }
                val savedUser = userRepo.save(user)
                savedUser.id.shouldNotBeNull()
                savedUser.username shouldBe "admin"
            }

            it("failed persist user") {
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
        }

        describe("item operations") {
            it("successful persist item") {
                val user =
                    userRepo.save(
                        User(
                            username = "admin",
                            name = "Administrator",
                            email = "admin@glomgold.com"
                        ).apply { applyPassword("admin") }
                    )
                val account = accountRepo.save(Account("Checking", "USD", AccountType.CHECKING, user.id!!))

                val item =
                    Item(
                        description = "Water",
                        value = BigDecimal(10),
                        ItemType.EXPENSE,
                        period = YearMonth.now(),
                        userId = user.id!!,
                        accountId = account.id!!
                    )

                val savedItem = itemRepo.save(item)
                savedItem.id.shouldNotBeNull()
                savedItem.description shouldBe "Water"
            }
        }

        it("check password") {
            val user =
                User(
                    username = "admin",
                    name = "Administrator",
                    email = "admin@glomgold.com"
                ).apply { applyPassword("admin") }
            userRepo.save(user)

            userRepo.findByUsername("admin")?.let { admin ->
                admin.checkPassword("admin") shouldBe true
                admin.checkPassword("other") shouldBe false
            }
        }

        it("delete cascade user") {
            val user =
                User(
                    username = "admin",
                    name = "Administrator",
                    email = "admin@glomgold.com"
                ).apply { applyPassword("admin") }
            val savedUser = userRepo.save(user)
            categorySeedService.seedDefaults(savedUser)
            val account = accountRepo.save(Account("Checking", "USD", AccountType.CHECKING, savedUser.id!!))

            itemRepo.save(
                Item(
                    description = "Water",
                    value = BigDecimal(10),
                    ItemType.EXPENSE,
                    period = YearMonth.now(),
                    userId = savedUser.id!!,
                    accountId = account.id!!
                )
            )

            userRepo.count() shouldBe 1
            categoryRepo.count() shouldBe 24
            categoryGroupRepository.count() shouldBe 6
            accountRepo.count() shouldBe 1
            itemRepo.count() shouldBe 1

            userRepo.delete(savedUser)

            userRepo.count() shouldBe 0
            categoryRepo.count() shouldBe 0
            categoryGroupRepository.count() shouldBe 0
            accountRepo.count() shouldBe 0
            itemRepo.count() shouldBe 0
        }
    })