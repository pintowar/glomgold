package com.github.pintowar.conf

import com.github.pintowar.model.Item
import com.github.pintowar.model.User
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.micronaut.context.annotation.Requires
import io.micronaut.runtime.event.annotation.EventListener
import io.micronaut.runtime.server.event.ServerStartupEvent
import jakarta.inject.Singleton
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import mu.KLogging
import java.math.BigDecimal
import java.time.YearMonth
import java.time.ZoneId
import java.util.*

@Requires(property = "micronaut.environments", value = "dev")
@Singleton
class SeedInitializer(
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository
) : KLogging() {

    @EventListener //does not support `suspend`
    fun onStartUp(e: ServerStartupEvent) {
        logger.info("starting data initialization at StartUpEvent: $e")
        runBlocking {
            val allItems = genUsers()
                .filter { userRepo.findByUsername(it.username) == null }
                .map { userRepo.save(it) }
                .filterNot { it.admin }
                .flatMap { user ->
                    val items = genItems(user)
                    itemRepo.saveAll(items).toList()
                }
            logger.info("Data initialization is done!! Generated ${allItems.size} items.")
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
            items.filter { Math.random() >= 0.3 }.map { (desc, value) ->
                Item(desc, BigDecimal(value), YearMonth.now().plusMonths(extraMonth.toLong()), user.id!!)
            }
        }
    }

}