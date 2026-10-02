package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.ChangePassword
import io.github.pintowar.glomgold.dto.CsvColumnMapping
import io.github.pintowar.glomgold.dto.ImportPreviewResponse
import io.github.pintowar.glomgold.dto.ImportResult
import io.github.pintowar.glomgold.dto.ItemBody
import io.github.pintowar.glomgold.dto.PanelAnnualReport
import io.github.pintowar.glomgold.dto.PanelOverallReport
import io.github.pintowar.glomgold.dto.ProfileInfo
import io.github.pintowar.glomgold.dto.UpdateProfile
import io.github.pintowar.glomgold.model.ItemOrigin
import io.github.pintowar.glomgold.repo.ItemRepository
import io.github.pintowar.glomgold.repo.UserRepository
import io.github.pintowar.glomgold.service.ImportService
import io.github.pintowar.glomgold.service.PanelService
import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.MediaType
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Consumes
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Part
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.multipart.CompletedFileUpload
import io.micronaut.security.authentication.Authentication
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.flow.toSet
import java.time.YearMonth
import java.time.ZoneId
import java.util.Locale

@Controller("/api/panel")
class PanelController(
    private val userRepository: UserRepository,
    private val itemRepository: ItemRepository,
    private val panelService: PanelService,
    private val importService: ImportService
) {
    @Get("/{?period}")
    suspend fun panel(
        auth: Authentication,
        @QueryValue period: YearMonth?
    ) = panelService.panelInfo(authId(auth), period ?: YearMonth.now())

    @Get("/yearly-report{?year,type}")
    suspend fun report(
        auth: Authentication,
        @QueryValue year: Int?,
        @QueryValue type: String?
    ): PanelAnnualReport {
        val currentYear = year ?: YearMonth.now().year
        val currentType = if (type in listOf("EXPENSE", "INCOME")) type else ""
        return panelService.annualReport(authId(auth), currentYear, currentType ?: "")
    }

    @Get("/overall-report")
    suspend fun overallReport(auth: Authentication): PanelOverallReport = panelService.overallReport(authId(auth))

    @Post("/profile/password")
    suspend fun profilePassword(
        auth: Authentication,
        passwords: ChangePassword
    ): HttpResponse<Unit> =
        userRepository.findById(authId(auth)).let { user ->
            if (user?.checkPassword(passwords.actualPassword) == true) {
                userRepository.update(user.apply { applyPassword(passwords.newPassword) })
                HttpResponse.ok()
            } else {
                HttpResponse.notModified()
            }
        }

    @Get("/profile")
    suspend fun profile(auth: Authentication): HttpResponse<ProfileInfo> =
        userRepository.findById(authId(auth))?.let { user ->
            HttpResponse.ok(ProfileInfo(user.name, user.email, user.locale, user.timezone))
        } ?: HttpResponse.notFound()

    @Patch("/profile")
    suspend fun updateProfile(
        auth: Authentication,
        @Body dto: UpdateProfile
    ): HttpResponse<Unit> =
        userRepository.findById(authId(auth))?.let { user ->
            val emailOwner = userRepository.findByEmail(dto.email)
            if (emailOwner != null && emailOwner.id != user.id) {
                HttpResponse.status(HttpStatus.CONFLICT)
            } else {
                user.name = dto.name
                user.email = dto.email
                user.locale = dto.locale
                user.timezone = dto.timezone
                userRepository.update(user)
                HttpResponse.ok()
            }
        } ?: HttpResponse.notFound()

    @Get("/locales")
    fun panelLocales(): List<Locale> = Locale.getAvailableLocales().sortedBy { it.toLanguageTag() }

    @Get("/timezones")
    fun panelTimezones(): List<String> = ZoneId.getAvailableZoneIds().sorted()

    @Get("/item-complete{?description}")
    suspend fun itemComplete(
        auth: Authentication,
        @QueryValue description: String?
    ): List<String> {
        val desc = if (description != null) "$description%" else ""
        return if (desc.isNotEmpty()) {
            itemRepository.findDistinctDescriptionByUserIdAndDescriptionIlike(authId(auth), desc)
        } else {
            emptyList()
        }
    }

    @Post("/add-item")
    suspend fun addItem(
        auth: Authentication,
        @Body item: ItemBody
    ): HttpResponse<Unit> {
        itemRepository.save(item.toItem(authId(auth)))
        return HttpResponse.ok()
    }

    @Patch("/edit-item/{id}")
    suspend fun editItem(
        auth: Authentication,
        @PathVariable id: Long,
        @Body item: ItemBody
    ): HttpResponse<Unit> =
        itemRepository.findByIdAndUserId(id, authId(auth))?.let { foundItem ->
            itemRepository.update(id, foundItem.version!!, item.description, item.value, item.itemType)
            HttpResponse.ok()
        } ?: HttpResponse.notFound()

    @Delete("/remove-item/{id}")
    suspend fun removeItem(
        auth: Authentication,
        @PathVariable id: Long
    ): HttpResponse<Unit> =
        itemRepository.findByIdAndUserId(id, authId(auth))?.let { item ->
            itemRepository.delete(item)
            HttpResponse.ok()
        } ?: HttpResponse.notFound()

    @Delete("/remove-items/{period}{?ids}")
    suspend fun removeItems(
        auth: Authentication,
        @PathVariable period: YearMonth,
        @QueryValue ids: List<Long>?
    ): HttpResponse<Unit> =
        itemRepository.findByIdInAndPeriodAndUserId(ids ?: emptyList(), period, authId(auth)).toList().let { items ->
            if (items.isEmpty()) {
                HttpResponse.notFound()
            } else {
                itemRepository.deleteAll(items)
                HttpResponse.ok()
            }
        }

    @Post("/copy-items")
    suspend fun copyItems(
        auth: Authentication,
        @Body items: List<ItemBody>
    ): HttpResponse<Unit> {
        val itemsToCopy =
            items
                .map { it.toItem(authId(auth)) }
                .groupBy { it.period }
                .flatMap { (period, periodItems) ->
                    val nextPeriod = period.plusMonths(1)
                    val nextItemsDesc =
                        itemRepository
                            .findByUserIdAndPeriod(authId(auth), nextPeriod)
                            .map { it.description }
                            .toSet()
                    periodItems.filter { it.description !in nextItemsDesc }.map { it.copy(period = nextPeriod) }
                }
        if (itemsToCopy.isNotEmpty()) itemRepository.saveAll(itemsToCopy).toList()
        return HttpResponse.ok()
    }

    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Post("/import-preview")
    suspend fun importPreview(
        @Part file: CompletedFileUpload,
        @Part("separator") separator: String?,
        @Part("dateFormat") dateFormat: String?,
        @Part("hasHeader") hasHeader: String?,
        @Part("mapDescription") mapDescription: String?,
        @Part("mapValue") mapValue: String?,
        @Part("mapType") mapType: String?,
        @Part("mapDate") mapDate: String?
    ): ImportPreviewResponse {
        val bytes = file.bytes
        val origin = importService.detectOrigin(file.filename, bytes)
        if (origin == ItemOrigin.OFX) return importService.previewOfx(bytes)
        val sep = (separator?.ifEmpty { "," } ?: ",").first()
        val fmt = dateFormat?.ifBlank { "yyyy-MM-dd" } ?: "yyyy-MM-dd"
        val withHeader = hasHeader?.toBooleanStrictOrNull() ?: true
        val mapping =
            CsvColumnMapping(
                mapDescription?.ifBlank { null },
                mapValue?.ifBlank { null },
                mapType?.ifBlank { null },
                mapDate?.ifBlank { null }
            )
        if (mapping != CsvColumnMapping()) return importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
        val first = importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
        val defaults = importService.defaultMapping(first.headers)
        return importService.previewCsv(bytes, sep, fmt, withHeader, defaults)
    }

    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Post("/import-items")
    suspend fun importItems(
        auth: Authentication,
        @Part file: CompletedFileUpload,
        @Part("separator") separator: String?,
        @Part("dateFormat") dateFormat: String?,
        @Part("hasHeader") hasHeader: String?,
        @Part("mapDescription") mapDescription: String?,
        @Part("mapValue") mapValue: String?,
        @Part("mapType") mapType: String?,
        @Part("mapDate") mapDate: String?
    ): ImportResult {
        val bytes = file.bytes
        val origin = importService.detectOrigin(file.filename, bytes)
        val preview =
            if (origin == ItemOrigin.OFX) {
                importService.previewOfx(bytes)
            } else {
                val sep = (separator?.ifEmpty { "," } ?: ",").first()
                val fmt = dateFormat?.ifBlank { "yyyy-MM-dd" } ?: "yyyy-MM-dd"
                val withHeader = hasHeader?.toBooleanStrictOrNull() ?: true
                val mapping =
                    CsvColumnMapping(
                        mapDescription?.ifBlank { null },
                        mapValue?.ifBlank { null },
                        mapType?.ifBlank { null },
                        mapDate?.ifBlank { null }
                    )
                if (mapping != CsvColumnMapping()) {
                    importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
                } else {
                    val first = importService.previewCsv(bytes, sep, fmt, withHeader, mapping)
                    importService.previewCsv(bytes, sep, fmt, withHeader, importService.defaultMapping(first.headers))
                }
            }
        return importService.importParsed(authId(auth), preview.rows, origin)
    }

    private fun authId(auth: Authentication): Long = auth.attributes["userId"] as Long
}