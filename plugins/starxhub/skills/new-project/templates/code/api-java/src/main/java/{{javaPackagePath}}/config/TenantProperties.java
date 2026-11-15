package {{javaPackage}}.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.tenant")
public class TenantProperties {
    /** 不注入 tenant_id 的表（如字典表、租户表本身）。 */
    private java.util.List<String> ignoreTables = java.util.List.of("t_tenant", "t_dict");
    private String column = "tenant_id";

    public java.util.List<String> getIgnoreTables() { return ignoreTables; }
    public String getColumn() { return column; }
    public void setIgnoreTables(java.util.List<String> ignoreTables) { this.ignoreTables = ignoreTables; }
    public void setColumn(String column) { this.column = column; }
}
