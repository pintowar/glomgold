package com.github.pintowar.model

import io.micronaut.data.annotation.Index
import io.micronaut.data.annotation.Indexes
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import mu.KLogging
import org.mindrot.jbcrypt.BCrypt
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
    @field:NotBlank var passwordHash: String = "",
    var enabled: Boolean = true
) : Entity() {

    companion object : KLogging()

    fun setPassword(passwd: String) {
        this.passwordHash = generatePasswordHash(passwd)
    }

    fun checkPassword(passwd: String): Boolean {
        logger.info { "Checking password" }
        return checkPasswordHash(this.passwordHash, passwd).also {
            logger.info { "Password checked" }
        }
    }

    fun isAdmin() = "admin" == username

    private fun generatePasswordHash(passwd: String) = BCrypt.hashpw(passwd, BCrypt.gensalt(16))

    private fun checkPasswordHash(passwordHash: String, password: String) = BCrypt.checkpw(password, passwordHash)
}