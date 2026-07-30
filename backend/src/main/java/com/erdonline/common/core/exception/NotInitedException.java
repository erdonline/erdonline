package com.erdonline.common.core.exception;

import cn.hutool.core.util.StrUtil;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/3/1 10:57
 * @describtion 未初始化异常
 * @since 1.0
 */
public class NotInitedException extends MartinException {

    private static final long serialVersionUID = -3523389113695008315L;

    public NotInitedException(Throwable e) {
        super(e);
    }

    public NotInitedException(String message) {
        super(message);
    }

    public NotInitedException(String messageTemplate, Object... params) {
        super(StrUtil.format(messageTemplate, params));
    }

    public NotInitedException(String message, Throwable throwable) {
        super(message, throwable);
    }

    public NotInitedException(Throwable throwable, String messageTemplate, Object... params) {
        super(StrUtil.format(messageTemplate, params), throwable);
    }
}
