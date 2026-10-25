package io.skyroute.api.config;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

// ponytail: ddl-auto is none, so this is the only create path. Upgrade is a real migration tool.
@Component
public class UserSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(UserSchemaInitializer.class);

    private final DataSource dataSource;

    public UserSchemaInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            for (String script : new String[] { "db/users.sql", "db/handle_new_user.sql" }) {
                try (InputStream in = new ClassPathResource(script).getInputStream()) {
                    statement.execute(new String(in.readAllBytes()));
                }
            }
            statement.execute("ALTER TABLE skyroute.users ALTER COLUMN created_at SET DEFAULT now()");
            statement.execute("ALTER TABLE skyroute.users ALTER COLUMN updated_at SET DEFAULT now()");
            statement.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_key
                    ON skyroute.users (replace(phone, ' ', ''))
                    WHERE phone IS NOT NULL AND btrim(phone) <> ''
                    """);
        } catch (Exception e) {
            SQLException sql = e instanceof SQLException s ? s : null;
            log.warn("users table not ready: {}", sql != null ? sql.getMessage() : e.getMessage());
        }
    }
}
