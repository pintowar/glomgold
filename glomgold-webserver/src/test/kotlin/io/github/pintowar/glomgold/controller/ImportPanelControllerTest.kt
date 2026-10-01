package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.ImportPreviewResponse
import io.github.pintowar.glomgold.dto.ImportResult
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.model.ItemType
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.collections.shouldContain
import io.kotest.matchers.shouldBe
import io.kotest.provided.authHeader
import io.kotest.provided.fakeUsers
import io.micronaut.http.HttpHeaders
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpStatus
import io.micronaut.http.MediaType
import io.micronaut.http.client.HttpClient
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.http.client.multipart.MultipartBody
import io.micronaut.test.extensions.kotest5.annotation.MicronautTest
import kotlinx.coroutines.flow.toList
import java.time.YearMonth

@MicronautTest(transactional = false)
class ImportPanelControllerTest(
    private val userRepo: UserRepository,
    private val itemRepo: ItemRepository,
    private val authClient: AuthClient,
    @Client("/") private val httpClient: HttpClient
) : DescribeSpec({

        beforeSpec {
            userRepo.deleteAll()
            fakeUsers().values.forEach { userRepo.save(it) }
        }

        beforeContainer { itemRepo.deleteAll() }

        describe("panel import operations") {
            val token = authHeader(authClient, "admin")

            fun previewRequest(
                filename: String,
                content: ByteArray,
                parts: Map<String, String> = emptyMap()
            ): HttpRequest<*> {
                val builder =
                    MultipartBody
                        .builder()
                        .addPart("file", filename, MediaType.TEXT_PLAIN_TYPE, content)
                parts.forEach { (k, v) -> builder.addPart(k, v) }
                return HttpRequest
                    .POST("/api/panel/import-preview", builder.build())
                    .header(HttpHeaders.AUTHORIZATION, token)
                    .contentType(MediaType.MULTIPART_FORM_DATA_TYPE)
            }

            fun importRequest(
                filename: String,
                content: ByteArray,
                parts: Map<String, String> = emptyMap()
            ): HttpRequest<*> =
                HttpRequest
                    .POST(
                        "/api/panel/import-items",
                        MultipartBody
                            .builder()
                            .addPart("file", filename, MediaType.TEXT_PLAIN_TYPE, content)
                            .apply { parts.forEach { (k, v) -> addPart(k, v) } }
                            .build()
                    ).header(HttpHeaders.AUTHORIZATION, token)
                    .contentType(MediaType.MULTIPART_FORM_DATA_TYPE)

            it("previews and imports a csv file, skipping duplicates on re-import") {
                val adminId = userRepo.findByUsername("admin")!!.id!!
                val csv =
                    """
                    description,value,type,date
                    Groceries,150.50,EXPENSE,2026-09-05
                    Salary,8000,INCOME,2026-09-01
                    """.trimIndent()
                val csvParts = mapOf("separator" to ",", "dateFormat" to "yyyy-MM-dd", "hasHeader" to "true")

                val preview =
                    httpClient
                        .toBlocking()
                        .exchange(
                            previewRequest("items.csv", csv.toByteArray(), csvParts),
                            ImportPreviewResponse::class.java
                        ).body
                        .get()
                preview.origin shouldBe ItemOrigin.CSV
                preview.headers shouldBe listOf("description", "value", "type", "date")
                preview.rows.size shouldBe 2
                preview.rows.count { it.valid } shouldBe 2
                preview.periodGroups shouldBe mapOf("2026-09" to 2)

                val first =
                    httpClient
                        .toBlocking()
                        .exchange(importRequest("items.csv", csv.toByteArray(), csvParts), ImportResult::class.java)
                        .body
                        .get()
                first.imported shouldBe 2
                first.skipped shouldBe 0
                first.periods shouldBe listOf(YearMonth.of(2026, 9))

                val saved = itemRepo.findByUserIdAndPeriod(adminId, YearMonth.of(2026, 9)).toList()
                saved.size shouldBe 2
                saved.all { it.origin == ItemOrigin.CSV } shouldBe true

                val second =
                    httpClient
                        .toBlocking()
                        .exchange(importRequest("items.csv", csv.toByteArray(), csvParts), ImportResult::class.java)
                        .body
                        .get()
                second.imported shouldBe 0
                second.skipped shouldBe 2
            }

            it("previews and imports an ofx file with OFX origin") {
                val adminId = userRepo.findByUsername("admin")!!.id!!
                val ofx =
                    """
                    OFXHEADER:100
                    DATA:OFXSGML
                    <OFX>
                    <BANKMSGSRSV1><STMTTRNRS><STMTRS>
                    <BANKTRANLIST>
                    <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260910<TRNAMT>-42.50<MEMO>Bakery</STMTTRN>
                    </BANKTRANLIST>
                    </STMTRS></STMTTRNRS></BANKMSGSRSV1>
                    </OFX>
                    """.trimIndent()

                val preview =
                    httpClient
                        .toBlocking()
                        .exchange(previewRequest("stmt.ofx", ofx.toByteArray()), ImportPreviewResponse::class.java)
                        .body
                        .get()
                preview.origin shouldBe ItemOrigin.OFX
                preview.rows.size shouldBe 1
                preview.rows.first().valid shouldBe true
                preview.rows.first().period shouldBe YearMonth.of(2026, 9)

                val result =
                    httpClient
                        .toBlocking()
                        .exchange(importRequest("stmt.ofx", ofx.toByteArray()), ImportResult::class.java)
                        .body
                        .get()
                result.imported shouldBe 1
                result.skipped shouldBe 0

                val items =
                    itemRepo
                        .listByPeriodAndUserIdOrderByCreatedAtAndDescription(YearMonth.of(2026, 9), adminId)
                        .toList()
                items.any { it.origin == ItemOrigin.OFX && it.description == "Bakery" } shouldBe true
            }

            it("parses a Banco-do-Brasil style ofx: latin-1, saldo rows dropped, type by sign") {
                val adminId = userRepo.findByUsername("admin")!!.id!!
                val ofx =
                    """
                    OFXHEADER:100
                    DATA:OFXSGML
                    <OFX>
                    <BANKMSGSRSV1><STMTTRNRS><STMTRS>
                    <BANKTRANLIST>
                    <STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260915<TRNAMT>250.00<MEMO>Salário mensal</STMTTRN>
                    <STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260916<TRNAMT>-89.90<MEMO>Padaria Pão de Açúcar</STMTTRN>
                    <STMTTRN><TRNTYPE>OTHER<DTPOSTED>20260901<TRNAMT>0<MEMO>SALDO ANTERIOR</STMTTRN>
                    </BANKTRANLIST>
                    </STMTRS></STMTTRNRS></BANKMSGSRSV1>
                    </OFX>
                    """.trimIndent().toByteArray(Charsets.ISO_8859_1)

                val preview =
                    httpClient
                        .toBlocking()
                        .exchange(previewRequest("extrato.ofx", ofx), ImportPreviewResponse::class.java)
                        .body
                        .get()
                preview.origin shouldBe ItemOrigin.OFX
                // saldo row vanishes: neither a preview row nor an error
                preview.rows.size shouldBe 2
                preview.rows.all { it.valid } shouldBe true
                preview.rows.none { (it.description ?: "").contains("SALDO", ignoreCase = true) } shouldBe true
                // accented memo decoded via latin-1 fallback, not mojibake
                preview.rows.map { it.description } shouldBe listOf("Salário mensal", "Padaria Pão de Açúcar")
                // TRNTYPE ignored: positive DEBIT is income, negative CREDIT is expense
                preview.rows.map { it.itemType } shouldBe listOf(ItemType.INCOME, ItemType.EXPENSE)

                val result =
                    httpClient
                        .toBlocking()
                        .exchange(importRequest("extrato.ofx", ofx), ImportResult::class.java)
                        .body
                        .get()
                result.imported shouldBe 2
                result.skipped shouldBe 0

                val items =
                    itemRepo
                        .listByPeriodAndUserIdOrderByCreatedAtAndDescription(YearMonth.of(2026, 9), adminId)
                        .toList()
                        .filter { it.origin == ItemOrigin.OFX }
                        .map { it.description to it.itemType }
                // earlier ofx test in this spec also saved into 2026-09: assert ours are present
                items shouldContain ("Salário mensal" to ItemType.INCOME)
                items shouldContain ("Padaria Pão de Açúcar" to ItemType.EXPENSE)
                items.none { (desc, _) -> desc.contains("SALDO", ignoreCase = true) } shouldBe true
            }

            it("rejects unauthenticated import preview") {
                val req =
                    HttpRequest
                        .POST(
                            "/api/panel/import-preview",
                            MultipartBody
                                .builder()
                                .addPart("file", "items.csv", MediaType.TEXT_PLAIN_TYPE, "a,b\n1,2".toByteArray())
                                .build()
                        ).contentType(MediaType.MULTIPART_FORM_DATA_TYPE)
                val ex =
                    shouldThrow<HttpClientResponseException> {
                        httpClient.toBlocking().exchange(req, Any::class.java)
                    }
                ex.status shouldBe HttpStatus.UNAUTHORIZED
            }
        }
    })