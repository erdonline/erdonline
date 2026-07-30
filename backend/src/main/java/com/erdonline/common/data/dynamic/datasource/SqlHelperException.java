package com.erdonline.common.data.dynamic.datasource;

import com.erdonline.common.core.exception.MartinException;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 12:32
 * @describtion: SqlHelperException
 */
public class SqlHelperException extends MartinException {
    public SqlHelperException(Throwable cause) {
        super(cause);
    }

    public SqlHelperException(String message, Throwable cause) {
        super(message, cause);
    }


    public SqlHelperException(String message) {
        super(message);
    }
}

