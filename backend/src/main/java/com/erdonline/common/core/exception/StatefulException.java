package com.erdonline.common.core.exception;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/3/1 10:56
 * @describtion 带有状态码的异常
 * @since 1.0
 */
public class StatefulException extends MartinException {
    private static final long serialVersionUID = 7378660735559113436L;
    private int status;

    public StatefulException() {
    }

    public StatefulException(String msg) {
        super(msg);
    }

    public StatefulException(String messageTemplate, Object... params) {
        super(StrUtil.format(messageTemplate, params));
    }

    public StatefulException(Throwable throwable) {
        super(throwable);
    }

    public StatefulException(String msg, Throwable throwable) {
        super(msg, throwable);
    }

    public StatefulException(ApiErrorCode apiErrorCode) {
        super(apiErrorCode.getMsg());
        this.status = apiErrorCode.getCode();
    }

    public StatefulException(int status, String msg) {
        super(msg);
        this.status = status;
    }

    public StatefulException(int status, Throwable throwable) {
        super(throwable);
        this.status = status;
    }

    public StatefulException(int status, String msg, Throwable throwable) {
        super(msg, throwable);
        this.status = status;
    }

    public int getStatus() {
        return this.status;
    }
}
