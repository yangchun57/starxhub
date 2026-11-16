package {{javaPackage}}.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
//@@TENANT_ONLY_START
import com.baomidou.mybatisplus.extension.plugins.inner.TenantLineInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.handler.TenantLineHandler;
import {{javaPackage}}.security.TenantContext;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.LongValue;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
//@@TENANT_ONLY_END
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
//@@TENANT_ONLY_START
@EnableConfigurationProperties(TenantProperties.class)
//@@TENANT_ONLY_END
public class MybatisPlusConfig {

    @Bean
    //@@TENANT_ONLY_START
    public MybatisPlusInterceptor mybatisPlusInterceptor(TenantProperties props) {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new TenantLineInnerInterceptor(new TenantLineHandler() {
            @Override
            public Expression getTenantId() {
                Long tenantId = TenantContext.get();
                return new LongValue(tenantId == null ? -1L : tenantId);
            }

            @Override
            public String getTenantIdColumn() {
                return props.getColumn();
            }

            @Override
            public boolean ignoreTable(String tableName) {
                return props.getIgnoreTables().contains(tableName);
            }
        }));
        PaginationInnerInterceptor pagination = new PaginationInnerInterceptor(DbType.MYSQL);
        pagination.setMaxLimit(200L);
        interceptor.addInnerInterceptor(pagination);
        return interceptor;
    }
    //@@TENANT_ONLY_END
    //@@SINGLE_ONLY_START
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        PaginationInnerInterceptor pagination = new PaginationInnerInterceptor(DbType.MYSQL);
        pagination.setMaxLimit(200L);
        interceptor.addInnerInterceptor(pagination);
        return interceptor;
    }
    //@@SINGLE_ONLY_END
}
