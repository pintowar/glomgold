package io.github.pintowar.glomgold.repository

import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.micronaut.data.event.PersistenceEventException
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import jakarta.validation.ConstraintViolationException
import java.math.BigDecimal
import java.time.YearMonth

@MicronautTest(transactional = false)
class UserRepositoryTest(
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository
) : DescribeSpec({

    beforeEach {
        itemRepo.deleteAll()
        userRepo.deleteAll()
    }

    describe("user operations") {

        it("successful persist user") {
            val user = User(
                username = "admin",
                name = "Administrator",
                email = "admin@glomgold.com"
            ).apply { applyPassword("admin") }
            val savedUser = userRepo.save(user)
            savedUser.id.shouldNotBeNull()
            savedUser.username shouldBe "admin"
        }

        it("failed persist user") {
            val user = User(
                username = "",
                name = "",
                email = "admin@glomgold.com"
            )
            val exception = shouldThrow<PersistenceEventException> {
                userRepo.save(user)
            }.cause as ConstraintViolationException
            exception.constraintViolations.size shouldBe 3
        }
    }

    describe("item operations") {
        val user = userRepo.save(
            User(
                username = "admin",
                name = "Administrator",
                email = "admin@glomgold.com"
            ).apply { applyPassword("admin") }
        )

        it("successful persist item") {
            val item = Item(
                description = "Water",
                value = BigDecimal(10),
                period = YearMonth.now(),
                userId = user.id!!
            )

            val savedItem = itemRepo.save(item)
            savedItem.id.shouldNotBeNull()
            savedItem.description shouldBe "Water"
        }
    }

    it("check password") {
        val user = User(
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
})