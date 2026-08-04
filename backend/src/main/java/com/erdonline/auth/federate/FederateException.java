package com.erdonline.auth.federate;

/**
 * 联邦登录业务异常（映射 HTTP 状态）。
 */
public class FederateException extends RuntimeException {

    private final int status;

    public FederateException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
