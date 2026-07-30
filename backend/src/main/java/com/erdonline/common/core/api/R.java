package com.erdonline.common.core.api;

import cn.hutool.core.util.StrUtil;

import java.io.Serializable;
import java.util.Optional;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/8/22
 * @describtion R 接口通用返回
 * @since 1.0
 */
public class R<T> implements Serializable {
    private static final long serialVersionUID = 1L;
    private int code;
    private T data;
    private String msg;

    public R() {
    }

    public R(IErrorCode errorCode) {
        errorCode = Optional.ofNullable(errorCode).orElse(ApiErrorCode.FAIL);
        this.code = errorCode.getCode();
        this.msg = errorCode.getMsg();
    }

    public static <T> R<T> ok(T data) {
        ApiErrorCode aec = ApiErrorCode.OK;
        if (data instanceof Boolean && Boolean.FALSE.equals(data)) {
            aec = ApiErrorCode.FAIL;
        }

        return restResult(data, aec);
    }

    public static <T> R<T> failed(String msg) {
        return restResult(null, ApiErrorCode.FAIL.getCode(), msg);
    }

    public static <T> R<T> failed(int code,String msg) {
        return restResult(null, code, msg);
    }

    public static <T> R<T> failed(IErrorCode errorCode) {
        return restResult(null, errorCode);
    }

    public static <T> R<T> restResult(T data, IErrorCode errorCode) {
        return restResult(data, errorCode.getCode(), errorCode.getMsg());
    }

    public static String pretty(String msg) {
        return StrUtil.C_BRACKET_START + msg + StrUtil.C_BRACKET_END;
    }

    private static <T> R<T> restResult(T data, int code, String msg) {
        R<T> apiResult = new R();
        apiResult.setCode(code);
        apiResult.setData(data);
        apiResult.setMsg(msg);
        return apiResult;
    }


    public int getCode() {
        return this.code;
    }

    public T getData() {
        return this.data;
    }

    public String getMsg() {
        return this.msg;
    }

    public R<T> setCode(final int code) {
        this.code = code;
        return this;
    }

    public R<T> setData(final T data) {
        this.data = data;
        return this;
    }

    public R<T> setMsg(final String msg) {
        this.msg = msg;
        return this;
    }

    public boolean valid(){
        return this.getCode() == ApiErrorCode.OK.getCode();
    }

    public boolean invalid(){
        return this.getCode() != ApiErrorCode.OK.getCode();
    }

    @Override
    public boolean equals(final Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof R)) {
            return false;
        } else {
            R<?> other = (R) o;
            if (!other.canEqual(this)) {
                return false;
            } else if (this.getCode() != other.getCode()) {
                return false;
            } else {
                Object thisData = this.getData();
                Object otherData = other.getData();
                if (thisData == null) {
                    if (otherData != null) {
                        return false;
                    }
                } else if (!thisData.equals(otherData)) {
                    return false;
                }

                Object thisMsg = this.getMsg();
                Object otherMsg = other.getMsg();
                if (thisMsg == null) {
                    if (otherMsg != null) {
                        return false;
                    }
                } else if (!thisMsg.equals(otherMsg)) {
                    return false;
                }

                return true;
            }
        }
    }

    protected boolean canEqual(final Object other) {
        return other instanceof R;
    }

    @Override
    public int hashCode() {
        int result = 1;
        long $code = this.getCode();
        result = result * 59 + (int) ($code >>> 32 ^ $code);
        Object $data = this.getData();
        result = result * 59 + ($data == null ? 43 : $data.hashCode());
        Object $msg = this.getMsg();
        result = result * 59 + ($msg == null ? 43 : $msg.hashCode());
        return result;
    }

    @Override
    public String toString() {
        return "R(code=" + this.getCode() + ", data=" + this.getData() + ", msg=" + this.getMsg() + ")";
    }
}
