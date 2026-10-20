package io.github.pintowar.glomgold.controller

import io.github.pintowar.glomgold.dto.UserCommand
import io.github.pintowar.glomgold.dto.toCommand
import io.github.pintowar.glomgold.model.User
import io.github.pintowar.glomgold.repo.UserRepository
import io.github.pintowar.glomgold.service.AccountService
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Patch
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import java.time.ZoneId
import java.util.Locale

@Controller("/api/users")
class UserController(
    private val userRepository: UserRepository,
    private val accountService: AccountService
) : CrudRestController<User, UserCommand, Long>(userRepository) {
    @Get("/locales")
    fun locales(): HttpResponse<List<Locale>> =
        HttpResponse.ok(Locale.getAvailableLocales().sortedBy { it.toLanguageTag() })

    @Get("/timezones")
    fun timezones(): HttpResponse<List<String>> = HttpResponse.ok(ZoneId.getAvailableZoneIds().sorted())

    /** Every new user gets a default CHECKING account, named after their locale. */
    @Post("/")
    override suspend fun create(
        @Body dto: UserCommand
    ): HttpResponse<UserCommand> =
        userRepository.save(dtoToEntity(dto)).let { user ->
            accountService.ensureDefaultChecking(user)
            HttpResponse.ok(entityToDto(user))
        }

    @Patch("/{id}/password")
    suspend fun password(
        @PathVariable id: Long,
        @Body dto: Map<String, String>
    ): HttpResponse<Unit> =
        userRepository.findById(id)?.let { user ->
            userRepository
                .update(user.apply { applyPassword(dto.getValue("password")) })
                .run { HttpResponse.ok() }
        } ?: HttpResponse.notFound()

    override fun dtoToEntity(dto: UserCommand): User = dto.toUser()

    override fun entityToDto(entity: User): UserCommand = entity.toCommand()

    override fun updateEntityFromDto(
        entity: User,
        dto: UserCommand
    ): User = dto.toUser().apply { passwordHash = entity.passwordHash }
}