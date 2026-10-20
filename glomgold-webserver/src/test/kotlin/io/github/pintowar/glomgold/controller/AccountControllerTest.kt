package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.AccountCommand
import io.github.pintowar.glomgold.dto.ItemCommand
import io.github.pintowar.glomgold.dto.RefinePaginateQuery
import io.github.pintowar.glomgold.dto.UserCommand
import io.github.pintowar.glomgold.model.Account
import io.github.pintowar.glomgold.model.AccountType
import io.github.pintowar.glomgold.model.ItemType
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.AccountRepository
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.shouldBe
import io.kotest.provided.authCookie
import io.kotest.provided.fakeItems
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Header
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.annotation.RequestBean
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import kotlinx.coroutines.flow.toList
import java.util.Locale

@MicronautTest(transactional = false)
class AccountControllerTest(
    private val userRepo: UserRepository,
    private val accountRepo: AccountRepository,
    private val itemRepo: ItemRepository,
    private val authClient: AuthClient,
    private val panelAccountClient: PanelAccountClient,
    private val adminAccountClient: AdminAccountClient,
    private val userClient: AdminUserClient,
    private val itemClient: ItemClient
) : DescribeSpec({

        val users = HashMap<String, User>()

        beforeSpec {
            itemRepo.deleteAll()
            accountRepo.deleteAll()
            userRepo.deleteAll()
            listOf("admin", "donald")
                .associateWith { userRepo.save(fakeUsers().getValue(it)) }
                .forEach { (username, user) -> users[username] = user }
        }

        beforeEach {
            itemRepo.deleteAll()
            accountRepo.deleteAll()
        }

        describe("panel accounts") {
            val token = authCookie(authClient, "admin")
            val donaldToken = authCookie(authClient, "donald")
            val adminId = users.getValue("admin").id!!

            it("creates accounts using the user default currency") {
                val adminAccount =
                    panelAccountClient.create(token, AccountCommand(name = "Wallet", type = AccountType.CHECKING))
                adminAccount.status shouldBe HttpStatus.OK
                adminAccount.body.get().currency shouldBe "USD"

                val donaldAccount =
                    panelAccountClient.create(
                        donaldToken,
                        AccountCommand(name = "Carteira", type = AccountType.CHECKING)
                    )
                donaldAccount.status shouldBe HttpStatus.OK
                donaldAccount.body.get().currency shouldBe "BRL"
            }

            it("lists only the user accounts ordered by id") {
                val first = panelAccountClient.create(token, AccountCommand(name = "Wallet")).body.get()
                val second =
                    panelAccountClient
                        .create(token, AccountCommand(name = "Card", type = AccountType.CREDIT_CARD))
                        .body
                        .get()
                panelAccountClient.create(donaldToken, AccountCommand(name = "Carteira"))

                val listed = panelAccountClient.list(token).body.get()
                listed shouldHaveSize 2
                listed.map { it.id } shouldBe listOf(first.id, second.id)
                listed.map { it.type } shouldBe listOf(AccountType.CHECKING, AccountType.CREDIT_CARD)
            }

            it("updates name, currency and type") {
                val account = panelAccountClient.create(token, AccountCommand(name = "Wallet")).body.get()

                val updated =
                    panelAccountClient.update(
                        token,
                        account.id!!,
                        AccountCommand(name = "Card", currency = "EUR", type = AccountType.CREDIT_CARD)
                    )

                updated.status shouldBe HttpStatus.OK
                updated.body.get().let {
                    it.name shouldBe "Card"
                    it.currency shouldBe "EUR"
                    it.type shouldBe AccountType.CREDIT_CARD
                }
            }

            it("keeps the current currency when a blank one is sent") {
                val account =
                    panelAccountClient.create(token, AccountCommand(name = "Wallet", currency = "GBP")).body.get()

                val updated = panelAccountClient.update(token, account.id!!, AccountCommand(name = "Wallet 2"))

                updated.body.get().currency shouldBe "GBP"
            }

            it("hard deletes the account and its items") {
                val account = panelAccountClient.create(token, AccountCommand(name = "Temp")).body.get()
                itemRepo.saveAll(fakeItems(adminId, account.id!!, 3)).toList()
                itemRepo.count() shouldBe 3

                panelAccountClient.delete(token, account.id).status shouldBe HttpStatus.OK

                accountRepo.findById(account.id) shouldBe null
                itemRepo.count() shouldBe 0
            }

            it("does not expose accounts from another user") {
                val donaldAccount = panelAccountClient.create(donaldToken, AccountCommand(name = "Carteira")).body.get()

                panelAccountClient.read(token, donaldAccount.id!!).status shouldBe HttpStatus.NOT_FOUND
                panelAccountClient
                    .update(token, donaldAccount.id, AccountCommand(name = "Hacked"))
                    .status shouldBe HttpStatus.NOT_FOUND
                panelAccountClient.delete(token, donaldAccount.id).status shouldBe HttpStatus.NOT_FOUND
            }
        }

        describe("item ownership") {
            val token = authCookie(authClient, "admin")
            val adminId = users.getValue("admin").id!!
            val donaldId = users.getValue("donald").id!!

            it("rejects items bound to another user account") {
                val donaldAccount = accountRepo.save(Account("Carteira", "BRL", AccountType.CHECKING, donaldId))

                val cmd =
                    ItemCommand(
                        description = "Stolen",
                        value = 10.0,
                        itemType = ItemType.EXPENSE,
                        year = 2026,
                        month = 1,
                        userId = adminId,
                        accountId = donaldAccount.id!!
                    )

                shouldThrow<HttpClientResponseException> {
                    itemClient.create(token, cmd)
                }.status shouldBe HttpStatus.BAD_REQUEST
            }

            it("accepts items bound to an owned account") {
                val account = accountRepo.save(Account("Wallet", "USD", AccountType.CHECKING, adminId))

                val cmd =
                    ItemCommand(
                        description = "Mine",
                        value = 10.0,
                        itemType = ItemType.EXPENSE,
                        year = 2026,
                        month = 1,
                        userId = adminId,
                        accountId = account.id!!
                    )

                val saved =
                    itemClient
                        .create(token, cmd)
                        .body
                        .get()
                saved.accountId shouldBe account.id

                val edited = itemClient.update(token, saved.id!!, saved)
                edited.status shouldBe HttpStatus.OK
                edited.body.get().accountId shouldBe account.id
            }
        }

        describe("user creation") {
            val token = authCookie(authClient, "admin")

            it("creates a locale named default checking account") {
                val en =
                    userClient.create(
                        token,
                        UserCommand(
                            username = "newen",
                            name = "New English",
                            email = "newen@glomgold.com",
                            locale = Locale.US
                        )
                    )
                en.status shouldBe HttpStatus.OK
                val enAccounts = accountRepo.findByUserIdOrderByIdAsc(en.body.get().id!!).toList()
                enAccounts shouldHaveSize 1
                enAccounts.first().let {
                    it.name shouldBe "Checking"
                    it.currency shouldBe "USD"
                    it.type shouldBe AccountType.CHECKING
                }

                val pt =
                    userClient.create(
                        token,
                        UserCommand(
                            username = "newpt",
                            name = "Novo Portugues",
                            email = "newpt@glomgold.com",
                            locale = Locale.of("pt", "BR")
                        )
                    )
                val ptAccounts = accountRepo.findByUserIdOrderByIdAsc(pt.body.get().id!!).toList()
                ptAccounts shouldHaveSize 1
                ptAccounts.first().let {
                    it.name shouldBe "Conta Corrente"
                    it.currency shouldBe "BRL"
                }
            }
        }

        describe("admin accounts") {
            val token = authCookie(authClient, "admin")

            fun page(path: String) = RefinePaginateQuery(HttpRequest.GET(path), 0, 25, "id", "ASC")

            it("creates accounts for another user") {
                val donaldId = users.getValue("donald").id!!

                val created =
                    adminAccountClient.create(
                        token,
                        AccountCommand(
                            name = "Donald Savings",
                            currency = "BRL",
                            type = AccountType.CHECKING,
                            userId = donaldId
                        )
                    )

                created.status shouldBe HttpStatus.OK
                created.body.get().userId shouldBe donaldId
                created.body.get().currency shouldBe "BRL"
            }

            it("lists accounts filtered by user") {
                val donaldId = users.getValue("donald").id!!
                val adminId = users.getValue("admin").id!!
                accountRepo.save(Account("Carteira", "BRL", AccountType.CHECKING, donaldId))
                accountRepo.save(Account("Donald Savings", "BRL", AccountType.CHECKING, donaldId))
                accountRepo.save(Account("Wallet", "USD", AccountType.CHECKING, adminId))

                val listed =
                    adminAccountClient
                        .list(token, RefinePaginateQuery(HttpRequest.GET("/api/accounts"), 0, 25, "id", "ASC"))
                        .body
                        .get()
                listed shouldHaveSize 3

                val donaldAccounts = adminAccountClient.listFiltered(token, donaldId).body.get()
                donaldAccounts shouldHaveSize 2
                donaldAccounts.map { it.userId }.distinct() shouldBe listOf(donaldId)
            }

            it("is restricted to admins") {
                val donaldToken = authCookie(authClient, "donald")
                shouldThrow<HttpClientResponseException> {
                    adminAccountClient.list(
                        donaldToken,
                        RefinePaginateQuery(HttpRequest.GET("/api/accounts"), 0, 25, "id", "ASC")
                    )
                }.status shouldBe HttpStatus.FORBIDDEN
            }
        }
    })

@Client("/api/panel/accounts")
interface PanelAccountClient {
    @Get("/")
    suspend fun list(
        @Header(HttpHeaders.COOKIE) auth: String
    ): HttpResponse<List<AccountCommand>>

    @Get("/{id}")
    suspend fun read(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<AccountCommand>

    @Post("/")
    suspend fun create(
        @Header(HttpHeaders.COOKIE) auth: String,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand>

    @Patch("/{id}")
    suspend fun update(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand>

    @Delete("/{id}")
    suspend fun delete(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<Unit>
}

@Client("/api/accounts")
interface AdminAccountClient {
    @Get("/{?_start,_end,_sort,_order}")
    suspend fun list(
        @Header(HttpHeaders.COOKIE) auth: String,
        @RequestBean pagination: RefinePaginateQuery
    ): HttpResponse<List<AccountCommand>>

    @Get("/{?userId,_start,_end,_sort,_order}")
    suspend fun listFiltered(
        @Header(HttpHeaders.COOKIE) auth: String,
        @QueryValue userId: Long,
        @QueryValue("_start") start: Int = 0,
        @QueryValue("_end") end: Int = 25,
        @QueryValue("_sort") sort: String = "id",
        @QueryValue("_order") order: String = "ASC"
    ): HttpResponse<List<AccountCommand>>

    @Post("/")
    suspend fun create(
        @Header(HttpHeaders.COOKIE) auth: String,
        @Body dto: AccountCommand
    ): HttpResponse<AccountCommand>

    @Delete("/{id}")
    suspend fun delete(
        @Header(HttpHeaders.COOKIE) auth: String,
        @PathVariable id: Long
    ): HttpResponse<Unit>
}

@Client("/api/users")
interface AdminUserClient {
    @Post("/")
    suspend fun create(
        @Header(HttpHeaders.COOKIE) auth: String,
        @Body dto: UserCommand
    ): HttpResponse<UserCommand>
}