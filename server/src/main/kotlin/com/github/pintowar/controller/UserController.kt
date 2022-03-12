package com.github.pintowar.controller

import com.github.pintowar.ext.between
import com.github.pintowar.model.User
import com.github.pintowar.repo.UserRepository
import io.micronaut.core.annotation.Introspected
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.ZoneId
import java.util.*
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank

@Controller("/api/users")
class UserController(private val userRepository: UserRepository) {

    @Get("/")
    suspend fun index(
        @QueryValue("_start", defaultValue = "0") start: Int,
        @QueryValue("_end", defaultValue = "25") end: Int,
        @QueryValue("_sort", defaultValue = "id") sort: String,
        @QueryValue("_order", defaultValue = "ASC") order: String
    ): HttpResponse<Flow<UserCommand>> = HttpResponse
        .ok(userRepository.findAll(between(start, end, sort, order)).map { UserCommand.toUserCommand(it) })
        .header("X-Total-Count", "${userRepository.count()}")

    @Post("/")
    suspend fun create(@Body user: UserCommand): HttpResponse<UserCommand> =
        HttpResponse.ok(UserCommand.toUserCommand(userRepository.save(user.toUser())))

    @Get("/{id}")
    suspend fun read(@PathVariable id: Long): HttpResponse<UserCommand> =
        HttpResponse.ok(userRepository.findById(id)?.let { UserCommand.toUserCommand(it) }) ?: HttpResponse.notFound()

    @Patch("/{id}")
    suspend fun update(@PathVariable id: Long, @Body user: UserCommand): HttpResponse<UserCommand> =
        userRepository.findById(id)?.let { _ ->
            HttpResponse.ok(UserCommand.toUserCommand(userRepository.update(user.toUser())))
        } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(@PathVariable id: Long) = userRepository.deleteById(id)
}

@Introspected
data class UserCommand(
    val id: Long? = null,
    val version: Int? = null,
    @field:NotBlank var username: String,
    @field:NotBlank var name: String,
    @field:Email var email: String,
    @field:NotBlank var password: String = "",
    var enabled: Boolean = true,
    var admin: Boolean = false,
    var locale: Locale = Locale.getDefault(),
    var timezone: ZoneId = ZoneId.systemDefault()
) {

    companion object {
        fun toUserCommand(user: User) = UserCommand(
            user.id, user.version, user.username, user.name, user.email,
            user.passwordHash, user.enabled, user.admin, user.locale, user.timezone
        )
    }

    fun toUser() = User(username, name, email, enabled = enabled, admin = admin, locale = locale, timezone = timezone)
        .apply {
            id = this@UserCommand.id
            version = this@UserCommand.version
            setPassword(password)
        }
}