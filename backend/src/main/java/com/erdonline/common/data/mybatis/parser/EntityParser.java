package com.erdonline.common.data.mybatis.parser;

import cn.hutool.core.annotation.AnnotationUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ArrayUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.ReflectUtil;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.extension.service.IService;
import com.erdonline.common.core.annotation.BindDict;
import com.erdonline.common.core.annotation.BindField;
import com.erdonline.common.core.constant.CommonConstants;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.data.mybatis.service.MartinService;
import com.erdonline.common.data.util.BeanUtils;
import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/17
 * @describtion EntityParser
 * @since 1.0
 */
@Slf4j
public class EntityParser {

    /**
     * Entity-对应的Service缓存
     */
    private static Map<String, IService> ENTITY_SERVICE_CACHE = new ConcurrentHashMap<>();
    /**
     * Entity-对应的 MartinService 缓存
     */
    private static Map<String, MartinService> ENTITY_MARTIN_SERVICE_CACHE = new ConcurrentHashMap<>();
    /**
     * 存储主键字段非id的Entity
     */
    private static Map<String, String> PK_NID_ENTITY_CACHE = new ConcurrentHashMap<>();
    /**
     * Entity-对应的带注解的字段信息缓存
     */
    private static Map<Class, List<TableLinkage>> ENTITY_TABLE_LINKAGE_CACHE = new ConcurrentHashMap<>();

    /**
     * 获取Entity主键
     *
     * @return
     */
    public static String getPrimaryKey(Class entity) {
        if (!PK_NID_ENTITY_CACHE.containsKey(entity.getName())) {
            String pk = CommonConstants.PRIMARY_KRY;
            List<Field> fields = BeanUtils.extractAllFields(entity);
            if (CollUtil.isNotEmpty(fields)) {
                for (Field fld : fields) {
                    TableId tableId = fld.getAnnotation(TableId.class);
                    if (tableId == null) {
                        continue;
                    }
                    TableField tableField = fld.getAnnotation(TableField.class);
                    if (tableField != null && tableField.exist() == false) {
                        continue;
                    }
                    pk = fld.getName();
                    break;
                }
            }
            PK_NID_ENTITY_CACHE.put(entity.getName(), pk);
        }
        return PK_NID_ENTITY_CACHE.get(entity.getName());
    }

    /**
     * 根据Entity获取对应的IService实现
     *
     * @param entity
     * @return
     */
    @Deprecated
    public static IService getIServiceByEntity(Class entity) {
        if (ENTITY_SERVICE_CACHE.isEmpty()) {
            Map<String, IService> serviceMap = SpringContextHelper.getApplicationContext().getBeansOfType(IService.class);
            if (CollUtil.isNotEmpty(serviceMap)) {
                for (Map.Entry<String, IService> entry : serviceMap.entrySet()) {
                    Class entityClass = BeanUtils.getGenericityClass(entry.getValue(), 1);
                    if (entityClass != null) {
                        ENTITY_SERVICE_CACHE.put(entityClass.getName(), entry.getValue());
                    }
                }
            }
        }
        IService iService = ENTITY_SERVICE_CACHE.get(entity.getName());
        if (iService == null) {
            log.error("未能识别到Entity: " + entity.getName() + " 的IService实现！");
        }
        return iService;
    }

    /**
     * 根据Entity获取对应的BaseService实现
     *
     * @param entity
     * @return
     */
    public static MartinService geMartinServiceByEntity(Class entity) {
        if (ENTITY_MARTIN_SERVICE_CACHE.isEmpty()) {
            Map<String, MartinService> serviceMap = SpringContextHelper.getApplicationContext().getBeansOfType(MartinService.class);
            if (CollUtil.isNotEmpty(serviceMap)) {
                for (Map.Entry<String, MartinService> entry : serviceMap.entrySet()) {
                    Class entityClass = BeanUtils.getGenericityClass(entry.getValue(), 1);
                    if (entityClass != null) {
                        ENTITY_MARTIN_SERVICE_CACHE.put(entityClass.getName(), entry.getValue());
                    }
                }
            }
        }
        MartinService baseService = ENTITY_MARTIN_SERVICE_CACHE.get(entity.getName());
        if (baseService == null) {
            log.info("未能识别到Entity: " + entity.getName() + " 的Service实现！");
        }
        return baseService;
    }

    /**
     * 根据Entity获取对应的该entity所有的外键注解信息
     *
     * @param entity
     * @return
     */
    public static List<TableLinkage> getTableLinkageByEntity(Class entity) {
        List<TableLinkage> tableLinkages = ENTITY_TABLE_LINKAGE_CACHE.get(entity);
        if (ObjectUtil.isNull(tableLinkages)) {
            tableLinkages = new ArrayList<>();
            Field[] declaredFields = ReflectUtil.getFields(entity);
            if (ArrayUtil.isNotEmpty(declaredFields)) {
                for (Field field : declaredFields) {
                    BindDict bindDict = field.getAnnotation(BindDict.class);
                    if (bindDict != null) {
                        String type = AnnotationUtil.getAnnotationValue(field, BindDict.class, "type");
                        String dictField = AnnotationUtil.getAnnotationValue(field, BindDict.class, "field");
                        MartinService dictService = (MartinService) SpringContextHelper.getBean(CommonConstants.DICT_SERVICE);
                        TableLinkage tableLinkage = new TableLinkage(type, field, dictField, null, dictService);
                        tableLinkages.add(tableLinkage);
                    }
                    BindField bindField = field.getAnnotation(BindField.class);
                    if (bindField != null) {
                        Class bindEntity = AnnotationUtil.getAnnotationValue(field, BindField.class, "entity");
                        String bindFields = AnnotationUtil.getAnnotationValue(field, BindField.class, "field");
                        MartinService martinService = EntityParser.geMartinServiceByEntity(bindEntity);
                        TableLinkage tableLinkage = new TableLinkage(null, field, bindFields, bindEntity, martinService);
                        tableLinkages.add(tableLinkage);
                    }
                }
                ENTITY_TABLE_LINKAGE_CACHE.put(entity, tableLinkages);
            } else {
                return null;
            }
        }
        return tableLinkages;
    }

}
