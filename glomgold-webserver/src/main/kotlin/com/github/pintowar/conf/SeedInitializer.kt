package com.github.pintowar.conf

import com.github.pintowar.model.Item
import com.github.pintowar.model.User
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.micronaut.context.annotation.Value
import io.micronaut.context.env.Environment
import io.micronaut.runtime.event.annotation.EventListener
import io.micronaut.runtime.server.event.ServerStartupEvent
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import mu.KLogging
import java.math.BigDecimal
import java.security.SecureRandom
import java.time.YearMonth
import java.time.ZoneId
import java.util.*

@Singleton
class SeedInitializer(
    @Value("glomgold.random.seed") randomSeed: String,
    env: Environment,
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository
) : KLogging() {

    private val random = SecureRandom(randomSeed.toByteArray())
    private val isProd = env.activeNames.contains("prod")
    private val isDev = env.activeNames.contains("dev")
    private val withSample = env.activeNames.contains("sample")

    @EventListener // does not support `suspend`
    fun onStartUp(e: ServerStartupEvent) {
        if (isProd || isDev) {
            logger.info("starting data initialization at StartUpEvent: $e")
            runBlocking {
                val allItems = genUsers()
                    .filter { userRepo.findByUsername(it.username) == null }
                    .filter { !(isProd && !withSample) || it.admin } // if (isProd && !withSample) it.admin else true
                    .map { userRepo.save(it) }
                    .filterNot { it.admin }
                    .flatMap { user ->
                        val items = genItems(user)
                        itemRepo.saveAll(items).toList()
                    }
                logger.info("Data initialization is done!! Generated ${allItems.size} items.")
            }
        }
    }

    private fun genUsers() = listOf(
        User(
            username = "admin",
            name = "Administrator",
            email = "admin@glomgold.com",
            admin = true
        ).apply { setPassword("admin") },
        User(
            username = "scrooge",
            name = "Scrooge McDuck",
            email = "scrooge@glomgold.com",
        ).apply { setPassword("123123") },
        User(
            username = "donald",
            name = "Donald Duck",
            email = "donald@glomgold.com",
            locale = Locale("pt", "BR"),
            timezone = ZoneId.of("America/Fortaleza")
        ).apply { setPassword("123123") }
    )

    private fun genItems(user: User): List<Item> {
        val items = listOf(
            Pair("Furniture", 10),
            Pair("Gym", 100),
            Pair("Condominium", 4000),
            Pair("Groceries", 4000),
            Pair("Clothing", 500),
            Pair("Transport", 500),
            Pair("Health", 2500),
            Pair("Food", 2000),
            Pair("Nightlife", 700),
            Pair("Security", 800),
            Pair("Presents", 300),
            Pair("Other services", 800),
        )
        return (0..3).flatMap { extraMonth ->
            items.filter { random.nextDouble() >= 0.3 }.map { (desc, value) ->
                Item(desc, BigDecimal(value), YearMonth.now().plusMonths(extraMonth.toLong()), user.id!!)
            }
        }
    }
}