package com.github.pintowar.model

import io.micronaut.data.annotation.Index
import io.micronaut.data.annotation.Indexes
import io.micronaut.data.annotation.MappedEntity
import io.micronaut.data.model.naming.NamingStrategies.UnderScoreSeparatedLowerCase
import mu.KLogging
import org.mindrot.jbcrypt.BCrypt
import java.security.SecureRandom
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

    companion object : KLogging() {
        private val secureRandom = SecureRandom()
    }

    fun setPassword(passwd: String) {
        if (passwd != this.passwordHash)
            this.passwordHash = generatePasswordHash(passwd)
    }

    fun checkPassword(passwd: String): Boolean {
        logger.info { "Checking password" }
        return checkPasswordHash(this.passwordHash, passwd).also {
            logger.info { "Password checked" }
        }
    }

    fun isAdmin() = "admin" == username

    private fun generatePasswordHash(passwd: String) = BCrypt.hashpw(passwd, BCrypt.gensalt(10, secureRandom))

    private fun checkPasswordHash(passwordHash: String, password: String) = BCrypt.checkpw(password, passwordHash)
}