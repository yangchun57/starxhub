package {{javaPackage}};

import {{javaPackage}}.common.BusinessException;
import {{javaPackage}}.common.ErrorCode;
import {{javaPackage}}.common.R;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RTest {

    @Test
    void shouldReturnCodeZeroWhenOk() {
        R<String> r = R.ok("pong");
        assertEquals(0, r.getCode());
        assertEquals("pong", r.getData());
        assertEquals("ok", r.getMessage());
    }

    @Test
    void shouldCarryErrorCodeWhenFail() {
        R<Void> r = R.fail(ErrorCode.NOT_FOUND.getCode(), "用户不存在");
        assertEquals(404, r.getCode());
        assertNull(r.getData());
    }

    @Test
    void shouldKeepCodeInBusinessException() {
        BusinessException e = new BusinessException(ErrorCode.TENANT_MISMATCH);
        assertEquals(403, e.getCode());
    }
}
