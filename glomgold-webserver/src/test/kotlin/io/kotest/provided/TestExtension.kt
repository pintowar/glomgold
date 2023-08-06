package io.kotest.provided

import io.github.pintowar.glomgold.controller.AuthClient
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.User
import io.github.serpro69.kfaker.faker
import io.micronaut.security.authentication.UsernamePasswordCredentials
import java.math.RoundingMode
import java.time.YearMonth
import java.time.ZoneId
import java.util.*

fun fakeItems(userId: Long, numItems: Int = 25): List<Item> {
    val faker = faker { fakerConfig { randomSeed = 42 } }
    return (0 until numItems).map {
        faker.randomProvider.randomClassInstance() {
            typeGenerator { faker.coffee.blendName() }
            typeGenerator { (faker.random.nextDouble() * 100).toBigDecimal().setScale(2, RoundingMode.HALF_UP) }
            typeGenerator { YearMonth.now().plusMonths(faker.random.nextLong(24)) }
            typeGenerator { userId }
        }
    }
}

fun fakeUsers(): Map<String, User> {
    return listOf(
        User(
            username = "admin",
            name = "Administrator",
            email = "admin@glomgold.com",
            locale = Locale.US,
            timezone = ZoneId.of("UTC"),
            admin = true
        ).apply { applyPassword("admin") },
        User(
            username = "scrooge",
            name = "Scrooge McDuck",
            email = "scrooge@glomgold.com",
            locale = Locale.US,
            timezone = ZoneId.of("UTC"),
        ).apply { applyPassword("scrooge") },
        User(
            username = "donald",
            name = "Donald Duck",
            email = "donald@glomgold.com",
            locale = Locale("pt", "BR"),
            timezone = ZoneId.of("America/Fortaleza")
        ).apply { applyPassword("donald") }
    ).associateBy { it.username }
}

suspend fun authHeader(authClient: AuthClient, username: String): String =
    "Bearer ${authClient.login(UsernamePasswordCredentials(username, username)).accessToken}"