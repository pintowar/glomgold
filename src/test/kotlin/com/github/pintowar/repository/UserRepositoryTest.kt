package com.github.pintowar.repository

import com.github.pintowar.model.Item
import com.github.pintowar.model.User
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.nulls.shouldNotBeNull
import io.kotest.matchers.shouldBe
import io.micronaut.data.event.PersistenceEventException
import io.micronaut.test.extensions.kotest.annotation.MicronautTest
import java.math.BigDecimal
import java.time.YearMonth
import java.util.*
import javax.validation.ConstraintViolationException

@MicronautTest
class UserRepositoryTest(
    private val userRepo: UserRepository, private val itemRepo: ItemRepository
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
            ).apply { setPassword("admin") }
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
        val user = userRepo.save(User(
            username = "admin",
            name = "Administrator",
            email = "admin@glomgold.com"
        ).apply { setPassword("admin") })

        it("successful persist item") {
            val item = Item(
                description = "Water",
                value = BigDecimal(10),
                period = YearMonth.now(),
                currency = Currency.getInstance("BRL"),
                user = user
            )

            val savedItem = itemRepo.save(item)
            savedItem.id.shouldNotBeNull()
            savedItem.description shouldBe "Water"
        }
    }

})
