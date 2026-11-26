package {{javaPackage}}.config;

import com.baomidou.mybatisplus.core.incrementer.IdentifierGenerator;
import com.baomidou.mybatisplus.extension.toolkit.DefaultIdentifierGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 雪花 ID 生成器（MyBatis-Plus ASSIGN_ID）。
 * worker-id 多实例部署时必须不同（0-31），用环境变量 SNOWFLAKE_WORKER_ID 覆盖。
 */
@Configuration
public class SnowflakeConfig {

    @Bean
    public IdentifierGenerator identifierGenerator(
            @Value("${machine.worker-id:1}") long workerId) {
        return new DefaultIdentifierGenerator(workerId);
    }
}
