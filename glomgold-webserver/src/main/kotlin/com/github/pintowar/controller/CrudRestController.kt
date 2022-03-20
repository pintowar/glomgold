package com.github.pintowar.controller

import com.github.pintowar.dto.RefinePaginateQuery
import com.github.pintowar.repo.EntityRepository
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.toList

abstract class CrudRestController<E, CMD, ID>(protected val repository: EntityRepository<E, ID>) {

    abstract fun entityToCmd(entity: E): CMD

    abstract fun cmdToEntity(command: CMD): E

    @Get("/{?_start,_end,_sort,_order}")
    suspend fun index(@RequestBean page: RefinePaginateQuery): HttpResponse<List<CMD>> = HttpResponse
        .ok(repository.findAll(page.paginate()).map(::entityToCmd).toList())
        .header("X-Total-Count", "${repository.count()}")

    @Post("/")
    suspend fun create(@Body cmd: CMD): HttpResponse<CMD> = repository.save(cmdToEntity(cmd))
        .let { HttpResponse.ok(entityToCmd(it)) }

    @Get("/{id}")
    suspend fun read(@PathVariable id: ID): HttpResponse<CMD> = repository.findById(id)
        .let { if (it != null) HttpResponse.ok(entityToCmd(it)) else HttpResponse.notFound() }

    @Patch("/{id}")
    suspend fun update(@PathVariable id: ID, @Body cmd: CMD): HttpResponse<CMD> = repository.findById(id)?.let { _ ->
        repository.update(cmdToEntity(cmd)).let { HttpResponse.ok(entityToCmd(it)) }
    } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(@PathVariable id: ID): Int = repository.deleteById(id)
}