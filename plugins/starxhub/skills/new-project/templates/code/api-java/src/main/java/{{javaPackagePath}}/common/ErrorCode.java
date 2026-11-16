package {{javaPackage}}.common;

/** 业务错误码集中管理，禁止在代码里散落魔法数字。 */
public enum ErrorCode {
    PARAM_INVALID(400, "参数校验失败"),
    UNAUTHORIZED(401, "未登录或令牌失效"),
    FORBIDDEN(403, "无权访问该资源"),
    NOT_FOUND(404, "资源不存在"),
#@@TENANT_ONLY_START
    TENANT_MISMATCH(403, "资源不属于当前租户"),
#@@TENANT_ONLY_END
    CONFLICT(409, "资源状态冲突"),
    INTERNAL_ERROR(500, "服务内部错误");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
}
