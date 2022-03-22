package com.github.pintowar.controller

import com.github.pintowar.dto.RefinePaginateQuery
import com.github.pintowar.repo.EntityRepository
import io.micronaut.data.repository.jpa.criteria.PredicateSpecification
import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.*

abstract class CrudRestController<E, DTO, ID>(private val repository: EntityRepository<E, ID>) {

    abstract fun entityToDto(entity: E): DTO

    abstract fun dtoToEntity(dto: DTO): E

    @Get("/{?_start,_end,_sort,_order}")
    open suspend fun index(@RequestBean pagination: RefinePaginateQuery): HttpResponse<List<DTO>> {
        val params = pagination.filterParams()
        val page = repository.findAll(predicates(params), pagination.paginate())
        return HttpResponse.ok(page.map(::entityToDto).toList()).header("X-Total-Count", "${page.totalSize}")
    }

    @Post("/")
    suspend fun create(@Body cmd: DTO): HttpResponse<DTO> = repository.save(dtoToEntity(cmd))
        .let { HttpResponse.ok(entityToDto(it)) }

    @Get("/{id}")
    suspend fun read(@PathVariable id: ID): HttpResponse<DTO> = repository.findById(id)
        .let { if (it != null) HttpResponse.ok(entityToDto(it)) else HttpResponse.notFound() }

    @Patch("/{id}")
    suspend fun update(@PathVariable id: ID, @Body cmd: DTO): HttpResponse<DTO> = repository.findById(id)?.let { _ ->
        repository.update(dtoToEntity(cmd)).let { HttpResponse.ok(entityToDto(it)) }
    } ?: HttpResponse.notFound()

    @Delete("/{id}")
    suspend fun delete(@PathVariable id: ID): Int = repository.deleteById(id)

    open fun predicates(params: Map<String, List<String>>): PredicateSpecification<E> {
        val cleanParams = params
            .mapValues { (_, v) -> v.filter { it.isNotEmpty() }.distinct() }
            .filterValues { it.isNotEmpty() }

        val truePredicate = PredicateSpecification<E> { _, cb -> cb.conjunction() }

        return cleanParams.map { (k, v) ->
            PredicateSpecification<E> { root, criteriaBuilder ->
                val idExp = root.get<Any>(k)
                when {
                    // At the time of writing this code, Micronaut Data doesn't support criteria "in" expression.
                    v.size > 1 -> criteriaBuilder.or(*(v.map { criteriaBuilder.equal(idExp, it) }.toTypedArray()))
                    v.size == 1 -> criteriaBuilder.equal(idExp, v.first())
                    else -> throw IllegalArgumentException("Illegal argument size.")
                }
            }
        }.fold(truePredicate) { acc, it -> acc.and(it) }
    }
}