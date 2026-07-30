package com.erdonline.common.data.util;


import cn.hutool.core.util.ArrayUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.support.AopUtils;
import org.springframework.core.ResolvableType;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Bean相关处理工具类
 *
 * @author mazc@dibo.ltd
 * @version v2.0
 * @date 2019/01/01
 */
@Slf4j
public class BeanUtils {

    /**
     * 获取目标类
     *
     * @param instance
     * @return
     */
    public static Class getTargetClass(Object instance) {
        Class targetClass = (instance instanceof Class) ? (Class) instance : AopUtils.getTargetClass(instance);
        return targetClass;
    }

    /**
     * 从实例中获取目标对象的泛型定义类class
     *
     * @param instance 对象实例
     * @param index
     * @return
     */
    public static Class getGenericityClass(Object instance, int index) {
        Class hostClass = getTargetClass(instance);
        ResolvableType resolvableType = ResolvableType.forClass(hostClass).getSuperType();
        ResolvableType[] types = resolvableType.getGenerics();
        if (ArrayUtil.isEmpty(types) || index >= types.length) {
            types = resolvableType.getSuperType().getGenerics();
        }
        if (ArrayUtil.isNotEmpty(types) && types.length > index) {
            return types[index].resolve();
        }
        log.debug("无法从 {} 类定义中获取泛型类{}", hostClass.getName(), index);
        return null;
    }

    /**
     * 获取类所有属性（包含父类中属性）
     *
     * @param clazz
     * @return
     */
    public static List<Field> extractAllFields(Class clazz) {
        List<Field> fieldList = new ArrayList<>();
        Set<String> fieldNameSet = new HashSet<>();
        while (clazz != null) {
            Field[] fields = clazz.getDeclaredFields();
            //被重写属性，以子类override的为准
            if (ArrayUtil.isNotEmpty(fields)) {
                Arrays.stream(fields).forEach((field) -> {
                    if (!fieldNameSet.contains(field.getName())) {
                        fieldList.add(field);
                        fieldNameSet.add(field.getName());
                    }
                });
            }
            clazz = clazz.getSuperclass();
        }
        return fieldList;
    }

}
