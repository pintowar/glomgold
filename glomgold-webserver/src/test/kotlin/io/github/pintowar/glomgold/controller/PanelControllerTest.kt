package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.*
import io.github.pintowar.glomgold.model.Item
import io.github.pintowar.glomgold.model.ItemType
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.provided.authHeader
import io.kotest.provided.fakeItems
import io.kotest.provided.fakeUsers
import io.micronaut.data.repository.jpa.criteria.PredicateSpecification
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.*
import io.micronaut.http.client.annotation.Client
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.toList
import java.math.BigDecimal
import java.time.YearMonth
import java.time.format.DateTimeFormatter

@MicronautTest(transactional = false)
class PanelControllerTest(
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository,
    private val authClient: AuthClient,
    private val panelClient: PanelClient
) : DescribeSpec({

    val users = HashMap<String, User>()

    beforeSpec {
        userRepo.deleteAll()
        val userList = listOf("admin", "donald")
            .associateWith { userRepo.save(fakeUsers().getValue(it)) }
        users.putAll(userList)
    }

    beforeContainer { itemRepo.deleteAll() }

    describe("panel operations - show panel") {
        val testUsername = "admin"
        val userId = users.getValue(testUsername).id!!
        val token = authHeader(authClient, testUsername)
        val totalItems = 10
        val actualPeriod = YearMonth.now()
        val periodFmt = DateTimeFormatter.ofPattern("yyyy-MM")

        fakeItems(userId, totalItems / 2).mapIndexed { idx, item ->
            item.apply {
                value = BigDecimal(if (idx % 2 == 0) 500 else 300)
                period = actualPeriod
                itemType = if (idx % 2 == 0) ItemType.EXPENSE else ItemType.INCOME
            }
        }.let { items -> itemRepo.saveAll(items + items).collect() }

        it("show empty panel (past search)") {
            val result = panelClient.panel(token, "2020-01")

            result.body.get().items.size shouldBe 0
            result.body.get().stats.size shouldBe 0
            result.body.get().period shouldBe YearMonth.of(2020, 1)
            result.body.get().total shouldBe BalanceSummary()
            result.body.get().diff shouldBe BalancePercent()
        }

        it("show panel") {
            val result = panelClient.panel(token, actualPeriod.format(periodFmt))

            result.body.get().items.size shouldBe totalItems
            result.body.get().stats.size shouldBe (totalItems / 2)
            result.body.get().period shouldBe actualPeriod
            result.body.get().total shouldBe BalanceSummary(BigDecimal(3000), BigDecimal(1200))
            result.body.get().diff shouldBe BalancePercent()
        }
    }

    describe("panel operations - edit panel") {
        val testUsername = "admin"
        val userId = users.getValue(testUsername).id!!
        val token = authHeader(authClient, testUsername)
        val actualPeriod = YearMonth.now()

        afterEach { itemRepo.deleteAll() }

        it("adding item") {
            val desc = "Some Item"
            val addedItem = ItemBody(actualPeriod, desc, BigDecimal("9.99"), ItemType.EXPENSE)
            val result = panelClient.addItem(token, addedItem)

            result.status shouldBe HttpStatus.OK

            val item = itemRepo.findOne { root, cb ->
                cb.equal(root.get<String>("description"), desc)
            }

            item?.period shouldBe actualPeriod
            item?.value shouldBe BigDecimal("9.99")
        }

        it("edit item") {
            val newDesc = "Other description"
            val item = itemRepo.save(Item("Some Item", BigDecimal("9.99"), ItemType.EXPENSE, actualPeriod, userId))
            val editedItem = ItemBody(actualPeriod, newDesc, BigDecimal("19.99"), ItemType.EXPENSE)
            val result = panelClient.editItem(token, item.id!!, editedItem)

            result.status shouldBe HttpStatus.OK

            val foundItem = itemRepo.findOne { root, cb ->
                cb.equal(root.get<String>("description"), newDesc)
            }

            foundItem?.period shouldBe actualPeriod
            foundItem?.value shouldBe BigDecimal("19.99")
        }

        it("invalid edit item") {
            val item = itemRepo.save(Item("Some Item", BigDecimal("9.99"), ItemType.EXPENSE, actualPeriod, userId))
            val editedItem = ItemBody(actualPeriod, "Other description", BigDecimal("19.99"), ItemType.EXPENSE)
            val result = panelClient.editItem(token, item.id!! + 1, editedItem) // non existent id

            result.status shouldBe HttpStatus.NOT_FOUND
        }

        it("remove item") {
            val item = itemRepo.save(Item("Some Item", BigDecimal("9.99"), ItemType.EXPENSE, actualPeriod, userId))
            val result = panelClient.removeItem(token, item.id!!)

            result.status shouldBe HttpStatus.OK

            itemRepo.findById(item.id!!) shouldBe null
        }

        it("invalid remove item") {
            val item = itemRepo.save(Item("Some Item", BigDecimal("9.99"), ItemType.EXPENSE, actualPeriod, userId))
            val result = panelClient.removeItem(token, item.id!! + 1) // non existent id

            result.status shouldBe HttpStatus.NOT_FOUND
        }

        it("copy items to next month") {
            val totalItems = 5
            val totalItemsNextMonth = 2
            val actualItems = fakeItems(userId, totalItems).map { item ->
                item.apply {
                    value = BigDecimal(500)
                    period = actualPeriod
                }
            }
            val nextItems = actualItems.take(totalItemsNextMonth).map {
                it.copy(value = BigDecimal(300), period = actualPeriod.plusMonths(1))
            }
            itemRepo.saveAll(nextItems).collect()

            val result = panelClient.copyItems(
                token,
                actualItems.map {
                    ItemBody(it.period, it.description, it.value, ItemType.EXPENSE)
                }
            )

            result.status shouldBe HttpStatus.OK

            val foundItems = itemRepo.findAll { root, cb ->
                cb.equal(root.get<String>("period"), actualPeriod.plusMonths(1))
            }.toList()

            foundItems.size shouldBe (totalItems)
            foundItems.count { it.value < BigDecimal(400) } shouldBe totalItemsNextMonth
            foundItems.all { it.userId == userId } shouldBe true
        }
    }

    describe("panel operations - show report") {
        val testUsername = "admin"
        val userId = users.getValue(testUsername).id!!
        val token = authHeader(authClient, testUsername)
        val totalItems = 5
        val expectedCols = 12
        val actualPeriod = YearMonth.now().withMonth(6)

        fakeItems(userId, totalItems).mapIndexed { idx, item ->
            item.apply {
                value = BigDecimal(if (idx % 2 == 0) 500 else 300)
                period = actualPeriod.plusMonths(if (idx % 2 == 0) 0 else 1)
                itemType = ItemType.INCOME
            }
        }.let { items -> itemRepo.saveAll(items + items).collect() }

        it("show empty report (past search)") {
            val result = panelClient.report(token, 2020)

            result.body.get().columns.size shouldBe expectedCols
            result.body.get().rowIndex shouldBe emptyList()
            result.body.get().data shouldBe emptyList()
            result.body.get().colSummary shouldBe emptyList()
            result.body.get().colAverage shouldBe emptyList()
            result.body.get().rowSummary.size shouldBe expectedCols
            result.body.get().rowTrend.size shouldBe expectedCols
            result.body.get().total shouldBe BigDecimal.ZERO
        }

        it("show report") {
            val result = panelClient.report(token, actualPeriod.year)
            val validColsValues = listOf(600, 1000).map { BigDecimal(it) }

            result.body.get().columns.size shouldBe expectedCols
            result.body.get().rowIndex.size shouldBe totalItems
            result.body.get().data.size shouldBe totalItems
            result.body.get().data.flatten().filterNotNull().all { it in validColsValues } shouldBe true
            result.body.get().colSummary.all { it in validColsValues } shouldBe true
            result.body.get().colAverage.all { it in validColsValues } shouldBe true
            result.body.get().rowSummary[5] shouldBe BigDecimal(3000)
            result.body.get().rowSummary[6] shouldBe BigDecimal(1200)
            result.body.get().rowTrend.all { it <= BigDecimal(2100) } shouldBe true
            result.body.get().total shouldBe BigDecimal(4200)
        }
    }
})

@Client("/api/panel")
interface PanelClient {

    @Get("/{?period}")
    suspend fun panel(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @QueryValue period: String? = null
    ): HttpResponse<PanelInfo>

    @Get("/report{?year}")
    suspend fun report(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @QueryValue year: Int? = null
    ): HttpResponse<PanelAnnualReport>

    @Post("/add-item")
    suspend fun addItem(@Header(HttpHeaders.AUTHORIZATION) auth: String, @Body item: ItemBody): HttpResponse<Unit>

    @Patch("/edit-item/{id}")
    suspend fun editItem(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @PathVariable id: Long,
        @Body item: ItemBody
    ): HttpResponse<Unit>

    @Delete("/remove-item/{id}")
    suspend fun removeItem(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @PathVariable id: Long
    ): HttpResponse<Unit>

    @Post("/copy-items")
    suspend fun copyItems(
        @Header(HttpHeaders.AUTHORIZATION) auth: String,
        @Body items: List<ItemBody>
    ): HttpResponse<Unit>
}