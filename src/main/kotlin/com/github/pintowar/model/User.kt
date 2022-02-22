package com.github.pintowar.model

import io.micronaut.data.annotation.*
import io.micronaut.data.annotation.event.PrePersist
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import org.mindrot.jbcrypt.BCrypt
import java.time.Instant
import javax.validation.constraints.Email
import javax.validation.constraints.NotBlank

@Indexes(
    Index(name = "username", columns = ["username"], unique = true),
    Index(name = "email", columns = ["email"], unique = true)
)
@MappedEntity(value = "users", namingStrategy = UnderScoreSeparatedLowerCase::class)
data class User(
    @field:NotBlank var username: String,
    @field:NotBlank var name: String,
    @field:Email var email: String,
    var enabled: Boolean = true,
) : Entity() {

    @field:NotBlank
    var passwordHash: String = ""
        private set

    fun setPassword(passwd: String) {
        this.passwordHash = generatePasswordHash(passwd)
    }

    fun checkPassword(passwd: String) = checkPasswordHash(this.passwordHash, passwd)

    fun isAdmin() = "admin" == username

    private fun generatePasswordHash(passwd: String) = BCrypt.hashpw(passwd, BCrypt.gensalt(16))

    private fun checkPasswordHash(passwordHash: String, password: String) = BCrypt.checkpw(password, passwordHash)
}