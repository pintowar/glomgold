package io.github.pintowar.glomgold.service.parser

import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.model.ItemType
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import java.math.BigDecimal
import java.time.LocalDate
import java.time.YearMonth

class OfxImportParserTest :
    StringSpec({

        val parser = OfxImportParser()

        fun ofx(vararg blocks: String): ByteArray =
            (
                "OFXHEADER:100\nDATA:OFXSGML\n<OFX>\n<BANKMSGSRSV1><STMTTRNRS><STMTRS>\n<BANKTRANLIST>\n" +
                    blocks.joinToString("\n") +
                    "\n</BANKTRANLIST>\n</STMTRS></STMTTRNRS></BANKMSGSRSV1>\n</OFX>"
            ).toByteArray()

        "previews debit and credit transactions with type by sign" {
            val bytes =
                ofx(
                    "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260910<TRNAMT>-42.50<MEMO>Bakery</STMTTRN>",
                    "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260915<TRNAMT>250.00<MEMO>Salary</STMTTRN>"
                )

            val res = parser.preview(bytes)

            res.origin shouldBe ItemOrigin.OFX
            res.hasHeader shouldBe false
            res.headers shouldBe emptyList()
            res.rows.size shouldBe 2
            res.rows.all { it.valid } shouldBe true
            res.rows[0].description shouldBe "Bakery"
            res.rows[0].value shouldBe BigDecimal("42.50")
            res.rows[0].itemType shouldBe ItemType.EXPENSE
            res.rows[0].date shouldBe LocalDate.of(2026, 9, 10)
            res.rows[0].period shouldBe YearMonth.of(2026, 9)
            // TRNTYPE ignored: positive DEBIT is income
            res.rows[1].itemType shouldBe ItemType.INCOME
            res.periodGroups shouldBe mapOf("2026-09" to 2)
        }

        "falls back to NAME and to Unknown for description" {
            val bytes =
                ofx(
                    "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260910<TRNAMT>-10<MEMO><NAME>Store</STMTTRN>",
                    "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260910<TRNAMT>-10<MEMO><NAME></STMTTRN>"
                )

            val res = parser.preview(bytes)

            res.rows[0].description shouldBe "Store"
            res.rows[1].description shouldBe "Unknown"
        }

        "drops balance-summary rows silently" {
            val bytes =
                ofx(
                    "<STMTTRN><TRNTYPE>OTHER<DTPOSTED>20260901<TRNAMT>100<MEMO>Salary</STMTTRN>",
                    "<STMTTRN><TRNTYPE>OTHER<DTPOSTED>20260901<TRNAMT>0<MEMO>SALDO ANTERIOR</STMTTRN>",
                    "<STMTTRN><TRNTYPE>OTHER<DTPOSTED>20260902<TRNAMT>0<MEMO>saldo do dia</STMTTRN>",
                    "<STMTTRN><TRNTYPE>OTHER<DTPOSTED>20260903<TRNAMT>0<MEMO>Saldo Final</STMTTRN>",
                    "<STMTTRN><TRNTYPE>OTHER<DTPOSTED>20260904<TRNAMT>0<MEMO>S A L D O consolidado</STMTTRN>"
                )

            val res = parser.preview(bytes)

            res.rows.size shouldBe 1
            res.rows[0].description shouldBe "Salary"
        }

        "returns an error row when no transactions are found" {
            val res = parser.preview("<OFX></OFX>".toByteArray())

            res.rows.size shouldBe 1
            res.rows[0].valid shouldBe false
            res.rows[0].error shouldBe "No transactions found in OFX file"
            res.periodGroups shouldBe emptyMap()
        }

        "reports invalid amount, zero value and invalid date" {
            val bytes =
                ofx(
                    "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260910<TRNAMT>abc<MEMO>Bad amount</STMTTRN>",
                    "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260910<TRNAMT>0<MEMO>Zero</STMTTRN>",
                    "<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>not-a-date<TRNAMT>-10<MEMO>Bad date</STMTTRN>"
                )

            val res = parser.preview(bytes)

            res.rows.size shouldBe 3
            res.rows.all { !it.valid } shouldBe true
            res.rows[0].error shouldBe "Invalid amount: abc"
            res.rows[1].error shouldBe "Value must be greater than zero"
            res.rows[2].error shouldBe "Invalid date: not-a-date"
        }

        "parses OFX datetimes with time suffix" {
            val bytes = ofx("<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260930120000<TRNAMT>15<MEMO>Shop</STMTTRN>")

            val res = parser.preview(bytes)

            res.rows.size shouldBe 1
            res.rows[0].valid shouldBe true
            res.rows[0].date shouldBe LocalDate.of(2026, 9, 30)
        }

        "decodes latin-1 files with accented memos" {
            val text =
                "OFXHEADER:100\nDATA:OFXSGML\n<OFX>\n<BANKMSGSRSV1><STMTTRNRS><STMTRS>\n<BANKTRANLIST>\n" +
                    "<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260915<TRNAMT>250.00<MEMO>Salário mensal</STMTTRN>\n" +
                    "</BANKTRANLIST>\n</STMTRS></STMTTRNRS></BANKMSGSRSV1>\n</OFX>"
            val bytes = text.toByteArray(Charsets.ISO_8859_1)

            val res = parser.preview(bytes)

            res.rows.size shouldBe 1
            res.rows[0].valid shouldBe true
            res.rows[0].description shouldBe "Salário mensal"
        }
    })