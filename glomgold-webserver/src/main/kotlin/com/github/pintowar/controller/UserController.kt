package com.github.pintowar.controller

import com.github.pintowar.dto.UserCommand
import com.github.pintowar.dto.toCommand
import com.github.pintowar.model.User
import com.github.pintowar.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import java.time.ZoneId
import java.util.*

@Controller("/api/users")
class UserController(private val userRepository: UserRepository) :
    CrudRestController<User, UserCommand, Long>(userRepository) {

    @Get("/locales")
    fun locales(): HttpResponse<List<Locale>> =
        HttpResponse.ok(Locale.getAvailableLocales().sortedBy { it.toLanguageTag() })

    @Get("/timezones")
    fun timezones(): HttpResponse<List<String>> = HttpResponse.ok(ZoneId.getAvailableZoneIds().sorted())

    @Patch("/{id}/password")
    suspend fun password(@PathVariable id: Long, @Body dto: Map<String, String>): HttpResponse<Void> {
        return userRepository.findById(id)?.let { user ->
            userRepository
                .update(user.apply { setPassword(dto.getValue("password")) })
                .run { HttpResponse.ok() }
        } ?: HttpResponse.notFound()
    }

    override fun dtoToEntity(dto: UserCommand): User = dto.toUser()

    override fun entityToDto(entity: User): UserCommand = entity.toCommand()

    override fun updateEntityFromDto(entity: User, dto: UserCommand): User =
        dto.toUser().apply { passwordHash = entity.passwordHash }
}