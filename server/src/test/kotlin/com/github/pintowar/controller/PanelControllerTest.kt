package com.github.pintowar.controller

import com.github.pintowar.dto.PanelAnnualReport
import com.github.pintowar.dto.PanelInfo
import com.github.pintowar.model.User
import com.github.pintowar.repo.ItemRepository
import com.github.pintowar.repo.UserRepository
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.provided.authHeader
import io.kotest.provided.fakeItems
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.client.annotation.Client
import io.micronaut.test.extensions.kotest.annotation.MicronautTest
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
import java.math.BigDecimal
import java.time.YearMonth
import java.time.format.DateTimeFormatter

@MicronautTest
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

    beforeContainer {
        runBlocking {
            itemRepo.deleteAll()
        }
    }

    describe("panel operations - show panel") {
        val testUsername = "admin"
        val userId = users.getValue(testUsername).id!!
        val totalItems = 10
        val actualPeriod = YearMonth.now()
        val periodFmt = DateTimeFormatter.ofPattern("yyyy-MM")

        fakeItems(userId, totalItems / 2).mapIndexed { idx, item ->
            item.apply {
                value = BigDecimal(if (idx % 2 == 0) 500 else 300)
                period = actualPeriod
            }
        }.let { items -> itemRepo.saveAll(items + items).collect() }

        it("show empty panel (past search)") {
            val token = authHeader(authClient, testUsername)
            val result = panelClient.panel(token, "2020-01")

            result.body.get().items.size shouldBe 0
            result.body.get().stats.size shouldBe 0
            result.body.get().period shouldBe YearMonth.of(2020, 1)
            result.body.get().total shouldBe BigDecimal.ZERO
            result.body.get().diff shouldBe BigDecimal.ZERO
        }

        it("show panel") {
            val token = authHeader(authClient, testUsername)
            val result = panelClient.panel(token, actualPeriod.format(periodFmt))

            result.body.get().items.size shouldBe totalItems
            result.body.get().stats.size shouldBe (totalItems / 2)
            result.body.get().period shouldBe actualPeriod
            result.body.get().total shouldBe BigDecimal(4200)
            result.body.get().diff shouldBe BigDecimal.ZERO
        }
    }

    describe("panel operations - show report") {
        val testUsername = "admin"
        val userId = users.getValue(testUsername).id!!
        val totalItems = 5
        val expectedCols = 12
        val actualPeriod = YearMonth.now().withMonth(6)

        fakeItems(userId, totalItems).mapIndexed { idx, item ->
            item.apply {
                value = BigDecimal(if (idx % 2 == 0) 500 else 300)
                period = actualPeriod.plusMonths(if (idx % 2 == 0) 0 else 1)
            }
        }.let { items -> itemRepo.saveAll(items + items).collect() }

        it("show empty report (past search)") {
            val token = authHeader(authClient, testUsername)
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
            val token = authHeader(authClient, testUsername)
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

}