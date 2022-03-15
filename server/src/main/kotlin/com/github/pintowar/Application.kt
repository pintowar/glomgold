package com.github.pintowar

import io.micronaut.runtime.Micronaut.*
fun main(args: Array<String>) {
    build()
        .args(*args)
        .packages("com.github.pintowar")
        .start()
}