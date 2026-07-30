package com.erdonline.common.core.api;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/8/22
 * @describtion IErrorCode 接口返回统一错误接口
 * @since 1.0
 */
public interface IErrorCode {
    /**
     * 获取错误码
     *
     * @return int
     */
    int getCode();

    /**
     * 获取错误信息
     *
     * @return String
     */
    String getMsg();
}
