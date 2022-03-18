package com.github.pintowar.controller

import com.github.pintowar.dto.RefinePaginateQuery
import com.github.pintowar.dto.UserCommand
import com.github.pintowar.dto.toUserCommand
import com.github.pintowar.repo.UserRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList

@Controller("/api/users")
class UserController(private val userRepository: UserRepository) {

    @Get("/{?_start,_end,_sort,_order}")
    suspend fun index(@RequestBean bean: RefinePaginateQuery): HttpResponse<List<UserCommand>> = HttpResponse
        .ok(userRepository.findAll(bean.paginate()).map { it.toUserCommand() }.toList())
        .header("X-Total-Count", "${userRepository.count()}")

    @Post("/")
    suspend fun create(@Body user: UserCommand): HttpResponse<UserCommand> =
        HttpResponse.ok(userRepository.save(user.toUser()).toUserCommand())

    @Get("/{id}")
    suspend fun read(@PathVariable id: Long): HttpResponse<UserCommand> =
        HttpResponse.ok(userRepository.findById(id)?.toUserCommand()) ?: HttpResponse.notFound()

    @Patch("/{id}")
    suspend fun update(@PathVariable id: Long, @Body user: UserCommand): HttpResponse<UserCommand> =
        userRepository.findById(id)?.let { _ ->
            HttpResponse.ok(userRepository.update(user.toUser()).toUserCommand())
        } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(@PathVariable id: Long) = userRepository.deleteById(id)
}
