package {{javaPackage}}.common;

import java.io.Serializable;

/** 统一响应信封：code=0 成功，非 0 为业务错误码。 */
public class R<T> implements Serializable {
    private int code;
    private T data;
    private String message;

    public static <T> R<T> ok(T data) {
        R<T> r = new R<>();
        r.code = 0;
        r.data = data;
        r.message = "ok";
        return r;
    }

    public static <T> R<T> fail(int code, String message) {
        R<T> r = new R<>();
        r.code = code;
        r.message = message;
        return r;
    }

    public int getCode() { return code; }
    public T getData() { return data; }
    public String getMessage() { return message; }
    public void setCode(int code) { this.code = code; }
    public void setData(T data) { this.data = data; }
    public void setMessage(String message) { this.message = message; }
}
