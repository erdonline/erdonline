package com.erdonline.common.security.exception;

import cn.hutool.core.collection.ListUtil;
import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.MartinException;
import com.erdonline.common.core.exception.StatefulException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.SQLIntegrityConstraintViolationException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/10/17
 * @describtion GlobalExceptionHandler
 * @since 1.0
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = Exception.class)
    @ResponseBody
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public R defaultErrorHandler(HttpServletRequest req, Exception e) throws Exception {
        log.error("", e);
        return R.failed(ApiErrorCode.FAIL);
    }

    /** Boot 3：未匹配路由/静态资源勿伪装成 500（如未暴露的 actuator 子路径） */
    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseBody
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public R noResourceFoundHandler(NoResourceFoundException e) {
        return R.failed(ApiErrorCode.NOT_FOUND);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    @ResponseBody
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public R accessDeniedExceptionHandler(HttpServletRequest req, AccessDeniedException e) throws Exception {
        log.error("", e);
        return R.failed(ApiErrorCode.UNAUTHORIZED);
    }

    @ExceptionHandler(value = IllegalArgumentException.class)
    @ResponseBody
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public R illegalArgumentExceptionHandler(HttpServletRequest req, IllegalArgumentException e) throws Exception {
        log.error("", e);
        return R.failed(e.getMessage());
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    @ResponseBody
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public R methodArgumentNotValidExceptionHandler(HttpServletRequest req, MethodArgumentNotValidException e) throws Exception {
        log.error("", e);
        BindingResult bindingResult = e.getBindingResult();
        List<ObjectError> allErrors = bindingResult.getAllErrors();
        List<Map> errorMsgs = new ArrayList<>();

        allErrors.forEach(objectError -> {
            HashMap<Object, Object> errorMsg = new HashMap<>(3);
            FieldError fieldError = (FieldError) objectError;
            errorMsg.put("field", fieldError.getField());
            errorMsg.put("objectName", fieldError.getObjectName());
            errorMsg.put("message", fieldError.getDefaultMessage());
            errorMsgs.add(errorMsg);
        });
        return R.restResult(errorMsgs, ApiErrorCode.FAIL);
    }

    @ResponseBody
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(BindException.class)
    public R bindExceptionHandler(BindException e) {
        log.error("", e);
        List<FieldError> fieldErrors = e.getBindingResult().getFieldErrors();
        List<String> msgList = fieldErrors.stream()
                .map(o -> o.getDefaultMessage())
                .collect(Collectors.toList());
        log.error("Validation 格式校验异常:-------------->{}", msgList);
        return R.restResult(msgList, ApiErrorCode.FAIL);

    }

    @ResponseBody
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(DuplicateKeyException.class)
    public R bindExceptionHandler(DuplicateKeyException e) {
        log.error("", e);
        String message = e.getMessage();
        //唯一索引冲突
        if (message.contains("Duplicate entry")) {
            String key = StrUtil.subBetween(message, "Duplicate entry", "for key").replace("'", "");
            return R.failed("「" + key + "」已存在");
        }
        return R.failed(ApiErrorCode.FAIL);
    }

    @ResponseBody
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(MartinException.class)
    public R bindExceptionHandler(MartinException e) {
        log.error("", e);
        return R.failed(e.getMessage());
    }

    @ResponseBody
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler(StatefulException.class)
    public R bindExceptionHandler(StatefulException e) {
        log.error("", e);
        return R.failed(e.getStatus(),e.getMessage());
    }
}
