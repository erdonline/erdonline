package com.erdonline.common.vip.contex;

import com.erdonline.common.vip.rights.BaseRight;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/7 15:07
 * @describtion: VIPContextHolder
 */
public class VIPContextHolder {
    private VIPContextHolder() {
    }

    private static VIPContextHolder instance = null;
    private ConcurrentHashMap<String, BaseRight> rights = new ConcurrentHashMap<>();


    public static VIPContextHolder getInstance() {
        if (instance == null) {
            synchronized (VIPContextHolder.class) {
                if (instance == null) {
                    instance = new VIPContextHolder();
                }
            }
        }
        return instance;
    }

    public static ConcurrentHashMap<String, BaseRight> getRights() {
        return getInstance().rights;
    }

    //批量存数据
    public static void setRights(ConcurrentHashMap<String, BaseRight> data) {
        getInstance().rights.putAll(data);
    }

    //存数据
    public static void add(String key, BaseRight right) {
        getInstance().rights.put(key, right);
    }

    //取数据
    public static BaseRight get(String key) {
        return getInstance().rights.get(key);
    }

    //删除实例
    public static void remove(String key) {
        getInstance().rights.remove(key);
    }
}
