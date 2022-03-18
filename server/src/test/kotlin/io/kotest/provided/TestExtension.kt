package io.kotest.provided

import com.github.pintowar.model.Item
import io.github.serpro69.kfaker.faker
import java.math.RoundingMode
import java.time.YearMonth

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
