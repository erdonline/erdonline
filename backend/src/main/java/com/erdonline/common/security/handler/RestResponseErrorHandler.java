package com.erdonline.common.security.handler;

import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.ResponseErrorHandler;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/4/13
 * @describtion 自定义restTemplate错误处理方式，避免默认的DefaultResponseErrorHandler不返回错误提示给前端
 * @since 1.0
 */
public class RestResponseErrorHandler implements ResponseErrorHandler {
    @Override
    public boolean hasError(ClientHttpResponse response) {
        return true;
    }

    @Override
    public void handleError(ClientHttpResponse response) {

    }
}
