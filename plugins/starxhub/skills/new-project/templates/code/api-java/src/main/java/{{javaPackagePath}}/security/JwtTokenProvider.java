package {{javaPackage}}.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 轻量 JWT 校验/签发（HS256，仅 JDK 内置 API，无第三方依赖）。
 * 生产环境建议换成 jjwt / Nimbus 并补齐过期、刷新、吊销逻辑。
 */
@Component
public class JwtTokenProvider {
    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private final String secret;

    public JwtTokenProvider(@Value("${jwt.secret:}") String secret) {
        this.secret = secret;
    }

    public boolean validate(String token) {
        if (token == null || secret == null || secret.isEmpty()) {
            return false;
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }
        return hmac(parts[0] + "." + parts[1]).equals(parts[2]);
    }

    public String subject(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        int i = payload.indexOf("\"sub\":\"");
        if (i < 0) {
            return null;
        }
        int end = payload.indexOf('"', i + 7);
        return end < 0 ? null : payload.substring(i + 7, end);
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC init failed", e);
        }
    }

    public String header() {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(HEADER.getBytes(StandardCharsets.UTF_8));
    }
}
