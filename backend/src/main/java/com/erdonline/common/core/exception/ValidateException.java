package com.erdonline.common.core.exception;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/3/1 10:58
 * @describtion 验证异常
 * @since 1.0
 */
public class ValidateException extends StatefulException {
    private static final long serialVersionUID = 8315347862065295371L;

    public ValidateException() {
    }

    public ValidateException(String msg) {
        super(msg);
    }

    public ValidateException(String messageTemplate, Object... params) {
        super(StrUtil.format(messageTemplate, params));
    }

    public ValidateException(Throwable throwable) {
        super(throwable);
    }

    public ValidateException(String msg, Throwable throwable) {
        super(msg, throwable);
    }

    public ValidateException(ApiErrorCode apiErrorCode) {
        super(apiErrorCode);
    }

    public ValidateException(int status, String msg) {
        super(status, msg);
    }

    public ValidateException(int status, Throwable throwable) {
        super(status, throwable);
    }

    public ValidateException(int status, String msg, Throwable throwable) {
        super(status, msg, throwable);
    }
}
