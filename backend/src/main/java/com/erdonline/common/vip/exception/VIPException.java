package com.erdonline.common.vip.exception;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.StatefulException;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/9/4
 * @describtion VIPException，带状态码的VIP异常
 * @since 1.0
 */
public class VIPException extends StatefulException {
    public VIPException() {
        super();
    }

    public VIPException(String msg) {
        super(msg);
    }

    public VIPException(String messageTemplate, Object... params) {
        super(messageTemplate, params);
    }

    public VIPException(Throwable throwable) {
        super(throwable);
    }

    public VIPException(String msg, Throwable throwable) {
        super(msg, throwable);
    }

    public VIPException(ApiErrorCode apiErrorCode) {
        super(apiErrorCode);
    }

    public VIPException(int status, String msg) {
        super(status, msg);
    }

    public VIPException(int status, Throwable throwable) {
        super(status, throwable);
    }

    public VIPException(int status, String msg, Throwable throwable) {
        super(status, msg, throwable);
    }

}
