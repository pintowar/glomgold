package io.github.pintowar.glomgold.service

import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.CategoryGroupRepository
import io.github.pintowar.glomgold.repo.CategoryRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import kotlinx.coroutines.flow.toList
import java.time.ZoneId
import java.util.Locale

@MicronautTest(transactional = false)
class CategorySeedServiceTest(
    private val seedService: CategorySeedService,
    private val userRepo: UserRepository,
    private val categoryRepo: CategoryRepository,
    private val groupRepo: CategoryGroupRepository
) : DescribeSpec({

        beforeTest {
            categoryRepo.deleteAll()
            groupRepo.deleteAll()
            userRepo.deleteAll()
        }

        describe("seedDefaults") {
            it("seeds groups and categories in the user's language without the sample environment") {
                val user =
                    userRepo.save(
                        User(
                            username = "seed-pt",
                            name = "Seed",
                            email = "seed@glomgold.com",
                            locale = Locale.of("pt", "BR"),
                            timezone = ZoneId.of("UTC")
                        ).apply { applyPassword("123123") }
                    )

                seedService.seedDefaults(user)

                val userId = user.id!!
                groupRepo.listScoped(userId).toList() shouldHaveSize 6
                val categories = categoryRepo.listScoped(userId).toList()
                categories shouldHaveSize 24
                categories.map { it.name } shouldContain "Aluguel"
                categories.all { it.isSystem } shouldBe true
            }

            it("is idempotent") {
                val user =
                    userRepo.save(
                        User("seed-en", "Seed", "seed2@glomgold.com").apply { applyPassword("123123") }
                    )

                seedService.seedDefaults(user)
                seedService.seedDefaults(user)

                groupRepo.listScoped(user.id!!).toList() shouldHaveSize 6
                categoryRepo.listScoped(user.id!!).toList() shouldHaveSize 24
            }
        }
    })