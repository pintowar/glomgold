import net.researchgate.release.GitAdapter.GitConfig
import net.researchgate.release.ReleaseExtension
import org.yaml.snakeyaml.Yaml
import java.io.File
import java.io.FileReader

fun ReleaseExtension.git(configure: GitConfig.() -> Unit) = (getProperty("git") as GitConfig).configure()

private fun valueResolver(value: String): String {
    val pattern = "\\$\\{(.+?)\\}".toRegex()
    return pattern.findAll(value)
        .map { it.groupValues }
        .fold(value) { acc, (str, match) ->
            val cleanMatch = match.trim()
            val idx = cleanMatch.indexOf(":")
            val (env, def) = if (idx > 0)
                cleanMatch.substring(0, idx) to cleanMatch.substring(idx + 1)
            else cleanMatch to ""
            acc.replace(str, System.getenv(env) ?: def)
        }
}

fun dbCredentials(projectDir: File, profile: String = "", diff: Boolean = false): Map<String, String> {
    val suffix = if (profile.isEmpty()) profile else "-$profile"
    val path = projectDir.toPath().resolve("src/main/resources/application$suffix.yaml")
    val config = (Yaml().load(FileReader(path.toFile())) as Map<*, *>)
        .let { app -> app["datasources"] as Map<*, *> }
        .let { ds -> ds["liquibase"] as Map<*, *> }
    val (username, password, url) = listOf("username", "password", "url").map { valueResolver(config[it] as String) }
    val dbName = url.substring(url.lastIndexOf("/") + 1)

    return if (!diff) mapOf("username" to username, "password" to password, "url" to url)
    else mapOf(
        "username" to username, "password" to password, "url" to url.replace(dbName, "previous_$dbName"),
        "referenceUsername" to username, "referencePassword" to password, "referenceUrl" to url
    )
}
